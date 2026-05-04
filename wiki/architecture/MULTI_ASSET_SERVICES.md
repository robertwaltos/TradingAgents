# Multi-Asset Service Architecture

## Service Map

Each asset class owns its own FastAPI service, its own Kafka topics, and its own TimescaleDB schema. No service reads another service's database directly.

```
┌────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                  │
│              REST (FastAPI)  ·  GraphQL (Strawberry)               │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
         ┌─────────────────────┼──────────────────────┐
         │                     │                      │
┌────────▼──────┐   ┌──────────▼────────┐   ┌────────▼──────────┐
│  EQUITY SVC   │   │   OPTIONS SVC     │   │   FUTURES SVC     │
│               │   │                   │   │                   │
│ • OHLCV cache │   │ • Chain snapshot  │   │ • Forward curve   │
│ • Earnings    │   │ • Greeks engine   │   │ • Roll schedule   │
│ • Splits      │   │ • Vol surface     │   │ • Basis calc      │
│ • Dividends   │   │ • Strategy P&L    │   │ • OI analysis     │
└───────────────┘   └───────────────────┘   └───────────────────┘
         │                     │                      │
┌────────▼──────┐   ┌──────────▼────────┐   ┌────────▼──────────┐
│   FOREX SVC   │   │   CRYPTO SVC      │   │    BONDS SVC      │
│               │   │                   │   │                   │
│ • Tick stream │   │ • Spot + perps    │   │ • Yield curves    │
│ • Carry calc  │   │ • DeFi TVL/APY   │   │ • Duration/DV01   │
│ • PPP model   │   │ • On-chain data   │   │ • Credit spreads  │
│ • Sessions    │   │ • Funding rate    │   │ • FRED polling    │
└───────────────┘   └───────────────────┘   └───────────────────┘
```

## Service Contracts

### Options Service

**REST endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/options/chain/{symbol}` | Full options chain with live Greeks |
| GET | `/options/vol-surface/{symbol}` | Volatility surface data for 3D render |
| POST | `/options/strategy/analyze` | Analyze multi-leg strategy |
| GET | `/options/expirations/{symbol}` | Available expiration dates |
| GET | `/options/greeks/{symbol}/{expiry}/{strike}/{type}` | Single contract Greeks |

**Kafka topics produced:**
- `options.greeks.{symbol}` — real-time Greeks updates
- `options.vol-surface.{symbol}` — surface rebuild events (every 30s)

---

### Futures Service

**REST endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/futures/chain/{root}` | All contracts in futures chain |
| GET | `/futures/forward-curve/{root}` | Forward curve data |
| GET | `/futures/basis/{root}` | Spot vs futures basis |
| GET | `/futures/roll-calendar` | Upcoming roll dates |

**Kafka topics produced:**
- `futures.tick.{root}` — real-time contract ticks
- `futures.oi.{root}` — open interest updates (daily)

---

### Forex Service

**REST endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/forex/rate/{pair}` | Current bid/ask/mid |
| GET | `/forex/carry/{pair}` | Carry trade metrics |
| GET | `/forex/ppp/{pair}` | PPP fair value estimate |
| GET | `/forex/sessions` | Active session status |

**Kafka topics produced:**
- `forex.tick.{pair}` — real-time quote ticks

---

### Crypto Service

**REST endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/crypto/metrics/{symbol}` | On-chain metrics |
| GET | `/crypto/defi/{protocol}` | DeFi TVL, APY, IL |
| GET | `/crypto/funding/{pair}` | Perp funding rate |
| GET | `/crypto/sentiment` | Fear & Greed, social vol |

---

### Bonds Service

**REST endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/bonds/yield-curve` | Current Treasury curve |
| GET | `/bonds/price/{cusip}` | Bond price, YTM, duration |
| GET | `/bonds/spreads` | Credit spread indices |
| GET | `/bonds/fred/{series}` | FRED series data |

## Cross-Service Communication

- Services communicate via **Kafka events** only — no direct HTTP calls between services
- **Portfolio Manager** aggregates positions across all asset services by subscribing to trade confirmation topics
- **Risk Manager** subscribes to all position and pricing topics to maintain real-time risk view
- **AI/ML Service** reads from analytics topics and writes signal events back to Kafka

## Deployment

Each service deploys as its own Kubernetes `Deployment` with its own `HorizontalPodAutoscaler`. Resource requests and limits differ by asset class:

| Service | CPU Request | Memory | Replicas (min/max) |
|---------|------------|--------|-------------------|
| Equity | 500m | 512Mi | 2 / 10 |
| Options | 2000m | 2Gi | 3 / 20 |
| Futures | 500m | 512Mi | 2 / 8 |
| Forex | 250m | 256Mi | 2 / 8 |
| Crypto | 500m | 1Gi | 2 / 10 |
| Bonds | 250m | 256Mi | 1 / 4 |

Options service is CPU-heavy due to Numba JIT vol surface rebuilds.
