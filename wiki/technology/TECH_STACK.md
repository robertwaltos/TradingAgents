# Technology Stack

## Final Stack Decision

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| **iOS/macOS UI** | SwiftUI + Combine | iOS 16+ / macOS 13+ | Native performance, system integration, Swift Charts |
| **Web Frontend** | Next.js + TypeScript | Next.js 15 | SSR, PWA, React 19 concurrent features |
| **Styling** | Tailwind CSS | v4 | Utility-first, dark theme, responsive |
| **State Management** | Zustand + TanStack Query | Latest | Lightweight, real-time cache sync |
| **Charts (web)** | TradingView Charting Library | v25 | Industry standard, professional |
| **Charts (iOS)** | Swift Charts | Native | Native performance, SwiftUI integration |
| **3D Visualisation** | Plotly.js | v2 | Volatility surfaces, correlation matrices |
| **Backend API** | FastAPI | 0.115+ | Async, auto-docs, type-safe, fast |
| **AI Orchestration** | LangGraph | 0.4+ | Existing foundation, stateful agents |
| **Real-time** | WebSocket (FastAPI) + Socket.io | — | Sub-50ms fan-out |
| **Stream processing** | Apache Kafka | 3.7+ | 1M+ msgs/sec, replay capability |
| **Primary DB** | PostgreSQL 16 + TimescaleDB | 2.16 | ACID, time-series, continuous aggregates |
| **Cache** | Redis 7 | — | Quote cache, sessions, rate limiting |
| **Financial Math** | NumPy + SciPy + Numba | Latest | JIT-compiled Greeks, vectorised VaR |
| **Task Queue** | Celery + Redis | — | Background analytics, portfolio rebalancing |
| **Container** | Docker + Kubernetes | K8s 1.30 | Auto-scaling, resilience |
| **Monitoring** | Prometheus + Grafana + Sentry | — | Metrics, dashboards, error tracking |
| **CI/CD** | GitHub Actions | — | Security scans, multi-platform tests |

## Why NOT alternatives

| Alternative | Rejected Because |
|------------|-----------------|
| Flutter (web) | Weak financial charting ecosystem; TradingView not available |
| React Native | SwiftUI gives better iOS performance and system API access |
| Django | Slower async than FastAPI; heavier for microservices |
| InfluxDB | TimescaleDB extends Postgres (familiar) and has better query language |
| Elasticsearch | Overkill for time-series; TimescaleDB continuous aggregates are sufficient |
| GraphQL only | REST needed for TradingView datafeed protocol compliance |

## Performance Targets vs Stack Capability

| Metric | Target | Stack Capability |
|--------|--------|-----------------|
| API P95 | < 100ms | FastAPI + uvloop: ~15ms at P99 for simple queries |
| WebSocket latency | < 50ms | Redis pub/sub + Socket.io: ~5ms local, ~30ms global CDN |
| Greeks calculation | 100k/sec | Numba JIT Black-Scholes: ~2M/sec on single core |
| Concurrent users | 10,000 | K8s HPA scales to demand; tested to 50k with Redis session cache |
