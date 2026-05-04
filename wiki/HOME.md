# TradingAgents Pro — Project Wiki

> **Vision:** Transform TradingAgents from an equity-focused LLM framework into a comprehensive, AI-powered multi-asset trading platform — rivalling Bloomberg Terminal and ThinkOrSwim — with native iOS, macOS, and web interfaces.

---

## 📚 Wiki Index

### Strategy & Planning
| Doc | Description |
|-----|-------------|
| [Development Roadmap](strategy/ROADMAP.md) | Phase-by-phase 12-month build plan with milestones |
| [Product Vision](strategy/PRODUCT_VISION.md) | Competitive positioning, personas, and success metrics |
| [Investment Case](strategy/INVESTMENT_CASE.md) | Budget, ROI, and business model |

### Research
| Doc | Description |
|-----|-------------|
| [Trading Platform Analysis](research/TRADING_PLATFORMS.md) | Deep-dive on ThinkOrSwim, IBKR, tastytrade, OptionNet Explorer |
| [Options Platform Benchmarks](research/OPTIONS_PLATFORMS.md) | Feature matrix and UX patterns from leading options tools |
| [Data Provider Matrix](research/DATA_PROVIDERS.md) | Provider comparison across all asset classes |

### Architecture
| Doc | Description |
|-----|-------------|
| [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) | Full platform architecture diagram and service map |
| [Multi-Asset Service Design](architecture/MULTI_ASSET_SERVICES.md) | Per-asset-class service boundaries |
| [Real-Time Data Pipeline](architecture/DATA_PIPELINE.md) | Kafka → Redis → WebSocket pipeline design |
| [AI Agent Architecture](architecture/AI_AGENTS.md) | Multi-agent expansion for all asset classes |

### Technology
| Doc | Description |
|-----|-------------|
| [Technology Stack](technology/TECH_STACK.md) | Final stack selection with justification |
| [iOS & macOS (SwiftUI)](technology/SWIFTUI.md) | Native app design patterns and components |
| [Web Frontend (React)](technology/REACT_FRONTEND.md) | React + TypeScript architecture |
| [Backend (FastAPI)](technology/FASTAPI_BACKEND.md) | Python backend services design |
| [Database Design](technology/DATABASE.md) | TimescaleDB + PostgreSQL schema |

### Financial Mathematics
| Doc | Description |
|-----|-------------|
| [Options Analytics](financial-math/OPTIONS.md) | Black-Scholes, Heston model, Greeks, volatility surface |
| [Futures Analytics](financial-math/FUTURES.md) | Forward curves, contango/backwardation, roll yield |
| [Forex Analytics](financial-math/FOREX.md) | PPP, IRP, carry trade, fundamental models |
| [Crypto & DeFi Analytics](financial-math/CRYPTO.md) | On-chain metrics, DeFi yield analysis |
| [Fixed Income Analytics](financial-math/BONDS.md) | Yield curves, duration, convexity, credit spreads |
| [Portfolio Risk Engine](financial-math/RISK.md) | VaR, stress testing, correlation framework |

### UI/UX Design
| Doc | Description |
|-----|-------------|
| [Design System](ui-ux/DESIGN_SYSTEM.md) | Colors, typography, spacing, component library |
| [Options UI Patterns](ui-ux/OPTIONS_UI.md) | Options chain, strategy builder, P&L diagrams |
| [Chart Standards](ui-ux/CHARTS.md) | TradingView integration, chart types, indicators |
| [Mobile Design](ui-ux/MOBILE.md) | iOS/macOS native UI patterns |

### Data Integration
| Doc | Description |
|-----|-------------|
| [Data Providers](data-integration/PROVIDERS.md) | Integration guides for Polygon, IBKR, Binance, etc. |
| [WebSocket Feeds](data-integration/WEBSOCKETS.md) | Real-time feed architecture and connection management |
| [Database Schema](data-integration/SCHEMA.md) | TimescaleDB hypertables and continuous aggregates |

### Security
| Doc | Description |
|-----|-------------|
| [Security Overview](security/OVERVIEW.md) | Koydo security standards applied to this project |
| [Security Audit Report](security/AUDIT_REPORT.md) | Original audit findings and mitigations |

---

## 🏗️ Project Status

| Phase | Status | Target |
|-------|--------|--------|
| **Phase 0** — Research & Design | ✅ Complete | May 2026 |
| **Phase 1** — Options MVP + Infrastructure | 🔲 Planned | Aug 2026 |
| **Phase 2** — Multi-Asset Expansion | 🔲 Planned | Nov 2026 |
| **Phase 3** — Native Mobile Apps | 🔲 Planned | Feb 2027 |
| **Phase 4** — Enterprise & Algo Trading | 🔲 Planned | May 2027 |

---

## 🗂️ Repository Structure

```
TradingAgents/
├── tradingagents/          # Core Python package (existing + expanded)
│   ├── agents/             # Multi-agent AI system
│   ├── dataflows/          # Data ingestion and processing
│   ├── graph/              # LangGraph orchestration
│   └── analytics/          # NEW: Financial math engine (Phase 1)
├── cli/                    # CLI interface
├── apps/                   # NEW: Platform applications (Phase 1+)
│   ├── web/                # React + TypeScript web app
│   ├── ios/                # SwiftUI iOS app
│   └── macos/              # SwiftUI macOS app
├── services/               # NEW: Microservices (Phase 1+)
│   ├── market-data/        # Real-time data ingestion
│   ├── analytics/          # Financial calculations API
│   ├── portfolio/          # Portfolio management
│   └── risk/               # Risk management
├── wiki/                   # This wiki
├── docs/                   # API documentation
└── infra/                  # Kubernetes + Docker configs
```

---

*Last updated: May 2026 — Phase 0 complete.*
