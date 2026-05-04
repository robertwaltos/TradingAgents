# Options Analytics

## Pricing Models

| Model | Use Case | Implemented In |
|-------|----------|----------------|
| **Black-Scholes** | Vanilla options, fast Greeks | `tradingagents/analytics/options/black_scholes.py` |
| **Heston** | Stochastic vol, volatility smile | `tradingagents/analytics/options/heston.py` |
| **Binomial Tree** | American options, early exercise | `tradingagents/analytics/options/binomial.py` |
| **Monte Carlo** | Exotic payoffs, path-dependent | `tradingagents/analytics/options/monte_carlo.py` |

## Greeks Reference

| Greek | Symbol | Measures | Formula (Black-Scholes) |
|-------|--------|----------|------------------------|
| **Delta** | Δ | Price sensitivity to spot | N(d₁) for call |
| **Gamma** | Γ | Delta sensitivity to spot | N'(d₁) / (S·σ·√T) |
| **Theta** | Θ | Price decay per day | -(S·N'(d₁)·σ)/(2√T) - r·K·e^(-rT)·N(d₂) |
| **Vega** | ν | Price sensitivity to IV | S·N'(d₁)·√T |
| **Rho** | ρ | Price sensitivity to rate | K·T·e^(-rT)·N(d₂) |
| **Vanna** | — | dVega/dSpot | -N'(d₁)·d₂/σ |
| **Volga** | — | dVega/dVol | S·N'(d₁)·√T·d₁·d₂/σ |
| **Charm** | — | dDelta/dTime | -N'(d₁)·(2rT - d₂·σ·√T) / (2T·σ·√T) |

## Volatility Surface

The volatility surface is constructed using:
1. **Raw IV** — solved per-contract via Brent's method
2. **SVI fitting** — Stochastic Volatility Inspired parameterisation per expiry slice
3. **Arbitrage removal** — calendar and butterfly spread checks before publishing

```
Vol
 ^
 │  ●   ●       ← Near expiry (steep skew)
 │    ●   ●
 │      ●   ●   ← Far expiry (flatter smile)
 │
 └──────────────────────────►
    ITM  ATM  OTM       Strike
```

## Pre-built Strategy Library

| Strategy | Legs | Max Profit | Max Loss |
|----------|------|-----------|----------|
| Long Call | +1C | Unlimited | Premium |
| Covered Call | +100sh, -1C | Strike - Cost | Cost - Premium |
| Bull Call Spread | +1C(K1), -1C(K2) | K2-K1-Net | Net Debit |
| Iron Condor | +1P(K1), -1P(K2), -1C(K3), +1C(K4) | Net Credit | Width - Credit |
| Butterfly | +1C(K1), -2C(K2), +1C(K3) | K2-K1-Net | Net Debit |
| Straddle | +1C(K), +1P(K) | Unlimited | Both Premiums |
| Strangle | +1C(K1), +1P(K2) | Unlimited | Both Premiums |
| Calendar | -1C(near), +1C(far) | Limited | Net Debit |

## Implementation Notes

- All pricing functions decorated with `@numba.jit(nopython=True, cache=True)` for maximum throughput
- Greeks are calculated analytically (not numerically) for speed
- IV solver uses Brent's method with bounds `[0.001, 5.0]`; returns `NaN` on failure rather than crashing
- Volatility surface is rebuilt every 30 seconds using cached options chain data
