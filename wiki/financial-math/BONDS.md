# Fixed Income Analytics

## Bond Pricing

```
P = Σ [C / (1+y)^t] + [F / (1+y)^T]
```

| Variable | Meaning |
|----------|---------|
| P | Dirty price |
| C | Coupon payment |
| F | Face value (par) |
| y | Yield to maturity (per period) |
| T | Total periods |

## Yield Metrics

### Yield to Maturity (YTM)
Solved numerically via Newton-Raphson iteration — the single discount rate that equates PV of cash flows to market price.

### Current Yield
```
Current Yield = Annual Coupon / Market Price
```

### Yield Spread
```
Spread = Bond YTM − Benchmark Treasury YTM
```
OAS (Option-Adjusted Spread) removes embedded option value from the raw spread.

## Duration & Convexity

| Measure | Formula | Use |
|---------|---------|-----|
| **Macaulay Duration** | Σ[t × PV(CF_t)] / P | Weighted time to cash flow receipt |
| **Modified Duration** | Macaulay D / (1 + y/n) | % price change per 1% yield change |
| **Dollar Duration (DV01)** | Modified D × P × 0.0001 | $ change per 1bp yield change |
| **Convexity** | Σ[t(t+1) × PV(CF_t)] / [P × (1+y)²] | Second-order price sensitivity |

### Price Change Approximation
```
ΔP ≈ −D_mod × P × Δy + ½ × Convexity × P × (Δy)²
```
Convexity term matters for large yield moves (>50 bps).

## Yield Curve Analysis

### Curve Shapes

| Shape | Condition | Economic Signal |
|-------|-----------|----------------|
| **Normal** | Long > Short | Growth expected |
| **Inverted** | Short > Long | Recession signal (2Y > 10Y inversion) |
| **Flat** | Near equal | Uncertainty / transition |
| **Humped** | Mid > Short & Long | Near-term tightening with long-run easing |

### Key Spreads

| Spread | Calculation | Signal |
|--------|-------------|--------|
| 2s10s | 10Y − 2Y | Steepening = growth; inversion = recession risk |
| 5s30s | 30Y − 5Y | Long-term inflation expectations |
| TED | 3M LIBOR − 3M T-Bill | Interbank credit stress |
| MOVE Index | — | Bond market volatility (VIX equivalent) |

## Credit Analysis

### Credit Spread Components
```
OAS = Spread − Liquidity Premium − Embedded Option Value
```

| Rating | Typical OAS Range |
|--------|------------------|
| AAA–AA | 20–60 bps |
| A | 60–120 bps |
| BBB | 120–250 bps |
| HY (BB) | 250–450 bps |
| HY (B) | 450–700 bps |
| CCC | 700+ bps |

### Altman Z-Score (Corporate Default Predictor)
```
Z = 1.2×X1 + 1.4×X2 + 3.3×X3 + 0.6×X4 + 1.0×X5
```
Z > 2.99 = safe; 1.81–2.99 = grey zone; < 1.81 = distress.

## Instruments Covered

| Category | Instruments |
|----------|-------------|
| **US Treasuries** | T-Bills, T-Notes (2Y, 5Y, 10Y), T-Bonds (30Y) |
| **TIPS** | Inflation-linked Treasuries |
| **Agency** | FNMA, FHLMC, FHLB |
| **IG Corporate** | Investment grade bonds (BBB− and above) |
| **HY Corporate** | High yield / junk bonds |
| **Municipals** | State and local government bonds |
| **EM Sovereign** | USD-denominated EM government bonds |

## Data Provider

Primary: **FRED** (Federal Reserve, free API)  
Key series: `DGS2`, `DGS5`, `DGS10`, `DGS30`, `FEDFUNDS`, `T10YIE` (breakeven inflation), `BAMLH0A0HYM2` (HY OAS)

## Implementation Notes

- Bond price always stored as clean price; accrued interest calculated and added for dirty price
- YTM solver iterates max 100 Newton-Raphson steps; falls back to bisection if gradient ≈ 0
- FRED series polled daily (REST, no WebSocket); intraday yield moves approximated from futures
- Portfolio duration and DV01 aggregated across all fixed income positions for hedging analysis
