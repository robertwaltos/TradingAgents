# Trading Platform Analysis

## Platforms Researched

### ThinkOrSwim (TD Ameritrade / Charles Schwab)
**Verdict:** Industry benchmark for options UX. Our primary UI reference.

| Category | Detail |
|----------|--------|
| **Strengths** | Options chain with live Greeks, thinkScript custom indicators, paper trading, deep backtesting |
| **Weaknesses** | Desktop-first, dated UI, poor mobile, no crypto, limited AI |
| **Key Features** | Level 2 quotes, volatility analysis, probability cones, spread scanner |
| **Our Response** | Match all features + add AI analysis + modern UI + mobile |

### Interactive Brokers TWS
**Verdict:** Best execution and data breadth; worst UX. Target institutional users we can capture.

| Category | Detail |
|----------|--------|
| **Strengths** | 150 markets, 33 countries, true multi-asset, lowest commissions, API depth |
| **Weaknesses** | TWS UI is unusable for retail, steep learning curve, 1990s design |
| **Key Features** | Risk Navigator, PortfolioAnalyst, algo orders, FIX API |
| **Our Response** | Same asset breadth, fraction of the complexity |

### tastytrade
**Verdict:** Best modern options UX. Our strongest direct competitor.

| Category | Detail |
|----------|--------|
| **Strengths** | Probability-focused design, IV rank/percentile front-and-centre, clean mobile app |
| **Weaknesses** | US markets only, no bonds, limited charting, no AI |
| **Key Features** | Expected move visualisation, portfolio beta-weighting, liquid hours |
| **Our Response** | All tastytrade features + multi-asset + AI agents + international |

### OptionNet Explorer (ONE)
**Verdict:** Best backtesting for options strategies. Reference for our backtesting module.

| Category | Detail |
|----------|--------|
| **Strengths** | Historical options data, SVI vol modelling, strategy screening, P&L attribution |
| **Weaknesses** | Windows desktop only, no real-time trading, expensive data |
| **Key Features** | Monte Carlo simulation, multi-leg strategy tester, Greeks over time |
| **Our Response** | Same depth + real-time + web/mobile + AI-driven strategy selection |

## Feature Matrix

| Feature | ThinkOrSwim | IBKR | tastytrade | ONE | **TradingAgents Pro** |
|---------|------------|------|-----------|-----|----------------------|
| Options chain (live) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Greeks (real-time) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Volatility surface | ✅ | ✅ | ❌ | ✅ | ✅ |
| Strategy builder | ✅ | ✅ | ✅ | ✅ | ✅ |
| Futures | ✅ | ✅ | ❌ | ❌ | ✅ |
| Forex | ✅ | ✅ | ❌ | ❌ | ✅ |
| Crypto | ❌ | ✅ | ❌ | ❌ | ✅ |
| Bonds | ❌ | ✅ | ❌ | ❌ | ✅ |
| Backtesting | ✅ | ✅ | ❌ | ✅ | ✅ (Phase 4) |
| AI analysis | ❌ | ❌ | ❌ | ❌ | ✅ |
| iOS native app | ✅ | ✅ | ✅ | ❌ | ✅ (Phase 3) |
| macOS native app | ✅ | ✅ | ❌ | ✅ | ✅ (Phase 3) |
| Web app | ✅ | ✅ | ✅ | ❌ | ✅ (Phase 1) |
| Public API | ❌ | ✅ | ❌ | ❌ | ✅ (Phase 4) |
