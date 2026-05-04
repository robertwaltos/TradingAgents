# Investment Case

## Problem

Retail and semi-professional traders lack a unified, intelligent platform that:
1. Covers **all major asset classes** (equities, options, futures, forex, crypto, bonds) in one place
2. Provides **AI-driven analysis** — not just data, but actionable insights
3. Works beautifully on **iOS, macOS, and web** with professional-grade visualisations
4. Is **accessible** — not locked behind $1,500+/month institutional subscriptions

## Market Opportunity

| Segment | Size | Pain Point |
|---------|------|-----------|
| US retail options traders | 1.5M+ active | TOS is dated; tastytrade limited to equities+options only |
| Crypto + options crossover | 400K+ | No platform serves both well |
| RIA / family offices | 50K firms | Institutional analytics without $50K/year Bloomberg |
| Self-directed HNW investors | 2M+ | Multi-asset portfolios managed across multiple apps |

**Total addressable market (US alone):** ~$4B annually in trading software subscriptions and data fees.

## Competitive Moats

1. **AI-first design.** Every asset class has dedicated LangGraph agent teams (VolatilityAnalyst, OnChainAnalyst, YieldCurveAnalyst, etc.). Competitors have at most basic screeners. Our AI explains *why* it recommends a trade, not just *what*.

2. **Cross-asset correlation.** Portfolio risk is managed across equities, options, crypto, and bonds simultaneously. No competitor does this in a consumer product.

3. **Native mobile experience.** SwiftUI with Swift Charts — not a web wrapper. 120fps ProMotion on iPhone 15 Pro. Options chains scroll at 60fps with 1000+ rows.

4. **Open API.** Traders can build custom workflows via REST/WebSocket. IBKR is the only major competitor with an API, and it is notoriously painful to use.

5. **Full financial math transparency.** Greeks calculated analytically (not black-box), vol surface displayed to all users (not locked behind "Pro" tier), formulas documented.

## Revenue Model

| Tier | Price | Features |
|------|-------|---------|
| **Free** | $0 | Watchlist, basic charting, delayed data |
| **Trader** | $49/month | Real-time data, all asset classes, basic Greeks |
| **Pro** | $149/month | Vol surface, AI agents, backtesting, API access |
| **Enterprise** | Custom | White-label, dedicated agents, SLA |

Projected blended ARPU: $85/month at steady state (mix of Trader/Pro).

## Unit Economics

| Metric | Year 1 | Year 3 |
|--------|--------|--------|
| Paying users | 1,000 | 15,000 |
| ARPU | $65 | $90 |
| Monthly Revenue | $65K | $1.35M |
| Data costs | $7.5K | $22K |
| Infrastructure | $15K | $45K |
| Gross Margin | ~65% | ~75% |

## Development Roadmap Milestones (Summary)

| Phase | Timeline | Deliverable |
|-------|---------|-------------|
| **Phase 0** | Complete | Koydo security hardening, CI/CD, multi-asset financial math |
| **Phase 1** | M1–M3 | Options + equities live, web app, basic AI agents |
| **Phase 2** | M4–M6 | All asset classes live, vol surface, cross-asset risk |
| **Phase 3** | M7–M9 | iOS/macOS native apps, advanced AI agents, backtesting |
| **Phase 4** | M10–M12 | Enterprise API, white-label, institutional features |

## Risk Factors

| Risk | Mitigation |
|------|-----------|
| IBKR TWS API changes | Tradier fallback for options data; normalised provider interface |
| LLM latency / cost | Tiered LLM use: `quick_think_llm` for frequent tasks, `deep_think_llm` only for complex analysis |
| Regulatory (investment advice) | AI outputs labelled as "analysis, not advice"; no order routing in Phase 1 |
| Data costs exceed projections | Volume pricing with Polygon; Glassnode/FRED free tier reduces crypto/bonds cost |
| Competitor response | Moat is 18-month head start on AI agent architecture + native mobile |

## Why Now

1. LangGraph 0.4+ provides production-grade stateful agent orchestration — previously unavailable.
2. SwiftUI's charting has reached parity with web-based charts for financial data.
3. Crypto + traditional asset convergence is accelerating (ETF approvals, institutional adoption).
4. Retail options trading volume has grown 8× since 2020 — demand is established.
5. The existing TauricResearch/TradingAgents foundation provides a working LLM agent framework to build on, compressing the roadmap by ~6 months.
