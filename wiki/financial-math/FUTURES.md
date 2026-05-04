# Futures Analytics

## Pricing Model

Futures are priced via **cost-of-carry**:

```
F = S · e^((r + u - y) · T)
```

| Variable | Meaning |
|----------|---------|
| S | Spot price |
| r | Risk-free rate |
| u | Storage / financing cost |
| y | Convenience yield |
| T | Time to expiry (years) |

## Forward Curve Shapes

| Shape | Condition | Meaning |
|-------|-----------|---------|
| **Contango** | F > S | Carry costs dominate; market expects higher future prices |
| **Backwardation** | F < S | Convenience yield > carry cost; near-term demand premium |
| **Flat** | F ≈ S | Carry costs balanced by convenience yield |

```
Price
  ^
  │   ─ ─ ─ ─     ← Contango (upward sloping)
  │ ─ ─
  │────────────    ← Flat
  │ ─ ─
  │   ─ ─ ─ ─     ← Backwardation (downward sloping)
  └────────────────────► Expiry
    Near       Far
```

## Greeks for Futures

| Measure | Formula | Notes |
|---------|---------|-------|
| **Delta** | 1.0 (linear) | Futures move 1:1 with spot |
| **Theta** | r · F · dt | Daily carry decay |
| **Basis** | F − S | Convergence to 0 at expiry |
| **Roll Yield** | (F_near − F_far) / F_far | Positive in backwardation |

## Futures-Specific Metrics

### Calendar Spread
```
Spread = F(T2) − F(T1)
```
Used to isolate time-value risk and trade term structure expectations.

### Roll Analysis
```python
def calculate_roll_yield(near_price: float, far_price: float, days_to_roll: int) -> float:
    """Annualised roll yield from contract rollover."""
    return (near_price - far_price) / far_price * (365 / days_to_roll)
```

### Open Interest Analysis
- Rising OI + rising price → strong uptrend (new longs entering)
- Falling OI + falling price → short covering rally (weak signal)
- OI divergence from price → potential reversal signal

## Asset Class Coverage

| Sector | Contracts | Exchange |
|--------|-----------|----------|
| **Equity Index** | ES, NQ, RTY, YM | CME |
| **Energy** | CL, NG, HO, RB | NYMEX |
| **Metals** | GC, SI, HG, PL | COMEX |
| **Agricultural** | ZC, ZS, ZW, KC | CBOT |
| **Interest Rate** | ZB, ZN, ZF, ZT | CBOT |
| **FX Futures** | 6E, 6B, 6J, 6A | CME |
| **Crypto Futures** | BTC, ETH | CME |

## Data Provider

Primary: **CME DataMine** (REST, historical)  
Fallback: **Quandl/Nasdaq Data Link**

Key fields per contract: `open_interest`, `volume`, `settlement_price`, `prev_settlement`, `tick_size`, `contract_size`, `margin_req`

## Implementation Notes

- Futures chain managed as a sorted list of `FuturesContract` objects ordered by expiry
- Roll logic triggered when front-month OI drops below 20% of total chain OI
- All prices normalised to USD notional value using `contract_size` multiplier
- Margin utilisation tracked in real-time against SPAN requirements from CME
