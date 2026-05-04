# AI Agent Architecture

## Expanded Multi-Agent System

Building on the existing LangGraph framework, the expanded agent system adds specialized teams for each asset class.

## Agent Teams

```
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                      │
│  Routes requests, coordinates teams, final decision  │
└─────────────┬───────────────────────────────────────┘
              │
    ┌─────────┼───────────────────────────────┐
    │         │         │         │            │
┌───▼───┐ ┌──▼────┐ ┌──▼───┐ ┌──▼────┐ ┌────▼───┐
│EQUITY │ │OPTIONS│ │FOREX │ │CRYPTO │ │ BONDS  │
│ TEAM  │ │ TEAM  │ │ TEAM │ │ TEAM  │ │  TEAM  │
└───┬───┘ └──┬────┘ └──┬───┘ └──┬────┘ └────┬───┘
    │        │          │        │             │
    └────────┴──────────┴────────┴─────────────┘
                        │
              ┌──────────────────┐
              │  CROSS-ASSET     │
              │  RISK AGENT      │
              │  PORTFOLIO AGENT │
              └──────────────────┘
```

## Per-Asset Agent Definitions

### Options Team
| Agent | Role | LLM |
|-------|------|-----|
| `VolatilityAnalyst` | IV regime, term structure, skew | deep_think_llm |
| `OptionsStrategyAdvisor` | Strategy selection given outlook + IV | deep_think_llm |
| `GreeksRiskAgent` | Portfolio Greeks, vega/gamma exposure | quick_think_llm |
| `OptionsResearcher` | Bull/bear debate on options positions | deep_think_llm |

### Crypto Team
| Agent | Role | LLM |
|-------|------|-----|
| `OnChainAnalyst` | Active addresses, NVT, network growth | quick_think_llm |
| `DeFiAnalyst` | TVL, yield farming APY, protocol risk | deep_think_llm |
| `CryptoSentimentAnalyst` | Social media, fear/greed index | quick_think_llm |
| `CryptoTechnicalAnalyst` | Price action, Mayer Multiple, vol | quick_think_llm |

### Bonds Team
| Agent | Role | LLM |
|-------|------|-----|
| `YieldCurveAnalyst` | Curve shape, inversion signals | deep_think_llm |
| `MacroEconomistAgent` | Fed policy, inflation, rate outlook | deep_think_llm |
| `CreditAnalyst` | Credit spreads, ratings, default risk | deep_think_llm |

## Structured Output Schema (Phase 1 Implementation)

```python
from pydantic import BaseModel
from typing import Literal

class AssetAnalysis(BaseModel):
    asset_class: Literal['equity', 'option', 'future', 'forex', 'crypto', 'bond']
    symbol: str
    recommendation: Literal['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']
    confidence: float  # 0.0 – 1.0
    rationale: str     # One paragraph
    key_risks: list[str]
    time_horizon: Literal['intraday', 'swing', 'position', 'long_term']
    suggested_position_size_pct: float  # % of portfolio
```

## Memory & Decision Log Integration

Each asset class extends the existing `trading_memory.md` log:

```
~/.tradingagents/memory/
├── equity_memory.md       # Existing
├── options_memory.md      # New
├── futures_memory.md      # New
├── forex_memory.md        # New
├── crypto_memory.md       # New
└── bonds_memory.md        # New
```

Cross-asset lessons (correlation breakdowns, regime changes) are written to a shared `cross_asset_lessons.md` that all agents read on startup.
