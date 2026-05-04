# Forex Analytics

## Fundamental Models

### Purchasing Power Parity (PPP)
```
E_PPP = P_domestic / P_foreign
```
Long-run fair value estimate. Deviation from PPP predicts mean reversion over 3–5 year horizons.

### Interest Rate Parity (IRP)
```
F/S = (1 + r_domestic) / (1 + r_foreign)
```
No-arbitrage condition linking spot rate, forward rate, and rate differential.

### Carry Trade Return
```
Carry = (r_high - r_low) × notional × T
Carry Return (vol-adj) = Carry / σ_pair
```
Positive carry when holding high-yield currency vs low-yield. Risk: sudden unwind during risk-off.

### Taylor Rule FX
```
r* = r_neutral + α(π − π*) + β(y − y*)
```
Central bank reaction function used to forecast policy divergence and currency direction.

## Technical Indicators

| Indicator | Signal |
|-----------|--------|
| 50/200 EMA cross | Trend direction |
| RSI | Overbought/oversold (>70/<30) |
| ATR | Volatility regime |
| Bollinger Bands | Mean reversion bands |
| MACD | Momentum confirmation |

## Pair Coverage

| Category | Pairs |
|----------|-------|
| **Majors** | EUR/USD, GBP/USD, USD/JPY, USD/CHF |
| **Commodity** | AUD/USD, NZD/USD, USD/CAD |
| **Crosses** | EUR/GBP, EUR/JPY, GBP/JPY |
| **EM** | USD/MXN, USD/BRL, USD/ZAR, USD/CNH |

## Risk Metrics

### Vol-Adjusted Carry
```python
def vol_adjusted_carry(rate_diff: float, pair_vol: float, tenor_days: int) -> float:
    annualised_carry = rate_diff * (tenor_days / 365)
    annualised_vol = pair_vol * (tenor_days / 365) ** 0.5
    return annualised_carry / annualised_vol  # Sharpe-like ratio
```

### Currency Beta
Correlation of each pair to a risk-on/risk-off composite (S&P 500 direction). High beta → safe-haven trades available.

## Session-Aware Analysis

| Session | Hours (UTC) | Key Pairs | Avg Daily Range |
|---------|-------------|-----------|-----------------|
| Tokyo | 00:00–09:00 | JPY, AUD, NZD | 60–80 pips |
| London | 07:00–16:00 | EUR, GBP, CHF | 100–140 pips |
| New York | 13:00–22:00 | USD majors | 80–120 pips |
| Overlap | 13:00–16:00 | All majors | Peak liquidity |

## Data Provider

Primary: **OANDA** (WebSocket streaming, REST history)  
Fallback: **FXCM**

Key fields: `bid`, `ask`, `mid`, `spread`, `rollover_rate`, `pip_value`

## Implementation Notes

- All rates quoted as convention pair (EUR/USD, not USD/EUR)
- Pip value normalised to USD per 100k notional
- OANDA provides real-time rollover (swap) rates — used for overnight carry calculation
- Session filter applied when computing session-specific volatility regimes
