# Options Platform Research

## Platform Comparison

| Feature | thinkorswim | IBKR Trader WB | tastytrade | OptionNet Explorer | OptionsPlay |
|---------|-------------|----------------|------------|-------------------|------------|
| **Real-time Greeks** | ✅ All 5 | ✅ All 5 + custom | ✅ All 5 | ✅ All 5 | ✅ Delta only |
| **Vol Surface (3D)** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Strategy Builder** | ✅ Multi-leg | ✅ Multi-leg | ✅ Guided | ✅ Multi-leg | ✅ Guided |
| **Payoff Diagram** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Backtesting** | ✅ thinkBack | ✅ | ✅ | ✅ | ❌ |
| **Scanner** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **IV Rank/Percentile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **P&L Zones** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rolling positions** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Mobile app** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **AI analysis** | ❌ | ❌ | ❌ | ❌ | ✅ (basic) |
| **API access** | ❌ | ✅ TWS API | ✅ REST | ❌ | ❌ |

## Platform Profiles

### thinkorswim (TD Ameritrade / Schwab)
**Strengths:**
- Gold standard for desktop options trading
- papermoney (full-featured paper trading with real data)
- thinkScript: custom indicator language
- Excellent charting with TOS-native indicators

**Weaknesses:**
- Desktop-only (desktop application, not web-native)
- Acquired by Schwab — platform continuity uncertain
- No 3rd party API access
- UI feels dated (Java Swing)

**Key UX patterns to adopt:**
- Active Trader ladder
- Risk profile / payoff diagram with sliders for date/IV shift
- P&L bubbles on the chart showing each position's contribution

---

### Interactive Brokers (Trader Workstation)
**Strengths:**
- Professional-grade, most asset classes
- TWS API: full programmatic access
- Real-time Greeks from IBKR's model
- Lowest margin rates in the industry

**Weaknesses:**
- Notoriously complex UI (learning curve)
- Commission structure confusing
- Mobile app is functional but not beautiful

**Key UX patterns to adopt:**
- Options chain column customisation (drag to reorder)
- Margin impact indicator when adding a leg
- Smart routing indicator showing fill quality

---

### tastytrade
**Strengths:**
- Designed exclusively for options traders
- Probabilistic analysis (Probability of Profit, Expected Value)
- Clean, modern UI — closest to consumer-grade polish
- Excellent education content embedded in-app

**Weaknesses:**
- US equities + some futures only (no forex, no crypto options)
- No institutional features
- Limited customisation

**Key UX patterns to adopt:**
- Probability of Profit displayed on every position (requires IV data)
- "Manage" button on positions for quick roll/close workflows
- Compact portfolio display with Buying Power Effect per position

---

### OptionNet Explorer
**Strengths:**
- Deep analytics for complex multi-leg strategies
- Historical backtesting with real option prices
- Advanced Greek profiles over time
- Risk analysis across multiple dimensions simultaneously

**Weaknesses:**
- Windows-only desktop app
- Expensive (~$200/month)
- Very steep learning curve
- No real-time trading — analysis only

**Key UX patterns to adopt:**
- Time-decay visualisation showing how the payoff diagram morphs each day
- Greeks over time chart (how Delta/Theta/Vega change as expiry approaches)
- Scenario analysis panel: simultaneously show IV up 10%, down 10%; price up 5%, down 5%

## Our Differentiators

| Feature | Existing Platforms | Our Platform |
|---------|-------------------|-------------|
| AI strategy advice | tastytrade basic | Full LangGraph agent team |
| Cross-asset | Mostly siloed | Unified portfolio across all classes |
| Mobile | Functional | Native SwiftUI, beautiful |
| Vol surface | TOS, ONE only | All users, 3D Plotly, real-time |
| API access | IBKR only | Full REST + WebSocket API |
| On-chain for options | None | Crypto + DeFi options coverage |

## Key UI Patterns Adopted

1. **From TOS:** Risk profile diagram with movable sliders (date to expiry, IV shift amount)
2. **From tastytrade:** Probability of Profit badge on every position; "Buying Power Effect" metric
3. **From OptionNet:** Greeks-over-time chart; scenario matrix panel (price ×IV stress grid)
4. **Our additions:** AI agent rationale panel; cross-asset correlation overlay; LLM-generated strategy suggestion
