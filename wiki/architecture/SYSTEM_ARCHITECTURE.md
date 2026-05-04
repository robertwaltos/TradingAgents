# System Architecture

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├──────────────────┬───────────────────┬───────────────────────────────┤
│   iOS App        │   macOS App       │   Web App (React PWA)         │
│   (SwiftUI)      │   (SwiftUI)       │   (Next.js + TypeScript)      │
│   Phase 3        │   Phase 3         │   Phase 1                     │
└──────────────────┴───────────────────┴───────────────────────────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │ HTTPS / WSS
┌──────────────────────────────────────────────────────────────────────┐
│                        GATEWAY LAYER                                 │
├───────────────┬──────────────────┬──────────────┬────────────────────┤
│  GraphQL API  │   REST API       │  WebSocket   │   Auth Service     │
│  (Strawberry) │  (FastAPI)       │  Gateway     │   (JWT + OAuth2)   │
└───────────────┴──────────────────┴──────────────┴────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────────┐
│                      CORE SERVICES                                   │
├────────────┬────────────┬────────────┬────────────┬──────────────────┤
│  Analytics │  Portfolio │    Risk    │   AI/ML    │  Alert Service   │
│  Engine    │  Manager   │  Manager  │  (LangGraph│                  │
│  (FastAPI) │  (FastAPI) │  (FastAPI) │  agents)   │                  │
└────────────┴────────────┴────────────┴────────────┴──────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────────┐
│                  ASSET-SPECIFIC SERVICES                             │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│  Equity  │ Options  │ Futures  │  Forex   │  Crypto  │    Bonds     │
│ Service  │ Service  │ Service  │ Service  │ Service  │   Service    │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
                              │
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                              │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  Polygon.io  │    IBKR      │   Binance    │  OANDA / FRED / CME    │
│  (equities)  │  (options)   │   (crypto)   │  (forex / bonds / fut) │
│  WebSocket   │  TWS API     │  WebSocket   │  WebSocket + REST      │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                                  │
├──────────────┬───────────────┬──────────────┬────────────────────────┤
│  TimescaleDB │     Redis     │    Kafka     │  Prometheus + Grafana  │
│  (tick data, │  (quotes,     │  (streaming  │  (metrics, dashboards, │
│   OHLCV,     │   sessions,   │   pipeline)  │   alerting)            │
│   portfolio) │   rate-limit) │              │                        │
└──────────────┴───────────────┴──────────────┴────────────────────────┘
```

## Service Responsibilities

| Service | Owns | Does NOT own |
|---------|------|-------------|
| **Analytics Engine** | Pricing models, Greeks, curve analysis, vol surface | Data fetching, portfolio state |
| **Portfolio Manager** | Positions, P&L, allocation | Pricing, risk calculation |
| **Risk Manager** | VaR, stress tests, margin | Portfolio state |
| **AI/ML Service** | LangGraph agents, LLM calls, decision log | Raw market data |
| **Data Ingestion** | Raw market data → Kafka → TimescaleDB | Business logic |

## Key Design Decisions

1. **Kafka as the backbone** — all market data flows through Kafka; no service polls another service's DB directly.
2. **TimescaleDB hypertables** — all tick and OHLCV data in hypertables partitioned by day; continuous aggregates replace pre-computed candles.
3. **Per-asset-class service isolation** — adding a new asset class = new service, no changes to existing services.
4. **AI agents are stateless** — all state lives in LangGraph checkpoints (SQLite) or the decision log markdown file; agents can be restarted freely.
5. **WebSocket fan-out via Redis pub/sub** — the WebSocket gateway subscribes to Redis channels populated by Kafka consumers; no direct WebSocket → Kafka coupling.
