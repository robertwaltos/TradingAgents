# Risk Analytics

## Value at Risk (VaR)

### Parametric VaR
```
VaR(α) = −(μ − z_α × σ) × Portfolio Value
```
Assumes returns are normally distributed. Fast but understates tail risk.

### Historical VaR
Uses the empirical return distribution — no normality assumption. Requires sufficient history (≥500 trading days).

### Monte Carlo VaR
Simulates 10,000+ scenarios from estimated covariance matrix. Handles non-linear payoffs (options).

### CVaR / Expected Shortfall
```
CVaR(α) = E[Loss | Loss > VaR(α)]
```
Average loss in the worst α% of scenarios. More coherent than VaR for tail risk.

## Portfolio-Level Metrics

### Correlation Matrix
```python
correlation_matrix = returns_df.corr()
```
Updated daily. Regime shifts (crisis) cause correlations to spike toward 1.0 — stress tests use crisis correlations.

### Herfindahl-Hirschman Index (Concentration)
```
HHI = Σ(w_i)²
```
| Range | Concentration Level |
|-------|-------------------|
| < 0.10 | Diversified |
| 0.10–0.18 | Moderate |
| > 0.18 | Concentrated |

### Diversification Ratio
```
DR = (Σ w_i × σ_i) / σ_portfolio
```
DR = 1 means perfectly correlated. Higher DR = more diversification benefit.

### Liquidity Risk Score
```
Score = Σ(w_i × (1 / avg_daily_volume_i))
```
Higher score = harder to unwind without market impact.

## Stress Testing

| Scenario | Description | Shock |
|----------|-------------|-------|
| **COVID Crash** | March 2020 | S&P −35%, VIX +300% |
| **2022 Rate Shock** | Fed hiking cycle | 10Y +300 bps |
| **2008 GFC** | Credit crisis | S&P −55%, credit spreads +600 bps |
| **Flash Crash** | May 2010 | Intraday −9% |
| **Crypto Winter** | 2022 bear | BTC −75%, ETH −80% |
| **USD Spike** | EM currency stress | DXY +15%, EM FX −20% |

## Per-Asset Risk Overlays

### Options Portfolio Greeks
Aggregate Greeks across all option positions:
- **Net Delta:** Directional exposure (hedge with futures)
- **Net Gamma:** Acceleration risk near expiry
- **Net Vega:** IV regime sensitivity
- **Net Theta:** Daily time decay (P&L drag)

### Futures Margin Utilisation
```
Margin Usage = Initial Margin Consumed / Account Value
```
Alert threshold: > 70%. Liquidation threshold: > 90%.

### Fixed Income Duration Risk
```
Portfolio DV01 = Σ(position_DV01_i)
```
Net DV01 tells how much P&L changes per 1 basis point move in rates.

### Crypto Drawdown
```
Max Drawdown = (Peak − Trough) / Peak
```
Tracked on rolling 90-day window. Alert threshold: > 30%.

## Risk Limits

| Risk Type | Soft Limit | Hard Limit | Action |
|-----------|-----------|------------|--------|
| Portfolio VaR (95%, 1d) | 2% NAV | 3% NAV | Reduce largest losers |
| Single Position | 5% NAV | 8% NAV | Block new adds |
| Sector Concentration | 20% NAV | 30% NAV | Alert |
| Net Delta (equity) | ±10% NAV | ±15% NAV | Hedge with index futures |
| Net Vega | ±5% NAV | ±8% NAV | Reduce options exposure |
| Margin Utilisation | 70% | 90% | Auto-reduce |

## Implementation Notes

- VaR computed nightly for the prior day; intraday VaR estimated by scaling positions by live prices
- Stress scenarios stored as coefficient vectors applied to portfolio positions — no re-pricing needed for linear assets
- Options stress tests use full re-pricing with shifted vol surface (±20% IV, ±10% spot)
- Correlation matrix uses EWMA with λ=0.94 (RiskMetrics standard) to weight recent observations more heavily
- All risk results published to Redis so the UI can display live without re-calculation
