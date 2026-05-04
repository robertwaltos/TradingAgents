# Options UI Reference

## Options Chain Screen

### Layout (desktop)
```
┌──────────────────────────────────────────────────────┐
│  [Symbol: AAPL ▾]  [Expiry: 2024-05-17 ▾]  [Refresh]│
├──────────────────────────────────────────────────────┤
│  Underlying: $182.45 (+1.2%)    IV Rank: 42   HV: 28│
├────────────────────────┬─────────┬───────────────────┤
│      CALLS             │ STRIKE  │      PUTS          │
│ Bid   Ask   OI   Vol   │         │ Bid   Ask   OI  Vol│
├────────────────────────┼─────────┼───────────────────┤
│ 18.30 18.50  2.4K  820 │  165    │  0.15  0.18  1.2K │
│ 13.40 13.60  5.1K 1.2K │  170    │  0.30  0.35  2.4K │
│  8.70  8.90  8.3K 2.8K │  175    │  0.80  0.90  6.8K │
│  4.60  4.80 12.1K 5.4K │  180    │  2.35  2.50 10.2K │
│◄  2.25  2.40 15.8K 8.1K │  182    │  4.10  4.25 12.8K ◄ATM│
│  0.90  1.00 14.2K 6.7K │  185    │  7.20  7.40  8.1K │
│  0.25  0.30 10.4K 3.2K │  190    │ 12.40 12.60  4.3K │
└────────────────────────┴─────────┴───────────────────┘
```

- ITM rows: subtle green (calls) / red (puts) background tint
- ATM row: amber left border, bold strike price
- Clicking any row opens contract detail sheet

### Contract Detail Sheet
```
┌────────────────────────────────────────┐
│  AAPL May 17 $182 Call                 │
│  Bid: 2.25  Ask: 2.40  Last: 2.35      │
│  OI: 15,800  Vol: 8,100  IV: 32.4%    │
├────────────────────────────────────────┤
│  Greeks                                │
│  Δ  0.524   Γ  0.0183   Θ  −0.047     │
│  ν  0.285   ρ  0.038    IV  32.4%     │
├────────────────────────────────────────┤
│  [Add to Strategy]  [Trade]            │
└────────────────────────────────────────┘
```

## Strategy Builder

### Leg Entry
```
┌─────────────────────────────────────────────────────┐
│  Strategy Builder                                   │
├─────────────────────────────────────────────────────┤
│  + Add Leg                                          │
│                                                     │
│  Leg 1: [Buy ▾] [1 ▾] [AAPL ▾] [May 17 ▾] [182C]  │
│  Leg 2: [Sell ▾] [1 ▾] [AAPL ▾] [May 17 ▾] [185C] │
│                                                     │
│  ─── Bull Call Spread detected ─────────────────── │
│  Net Debit: $1.40  Max Profit: $1.60  RR: 1:1.14   │
│  Breakeven: $183.40                                 │
└─────────────────────────────────────────────────────┘
```

### Payoff Diagram
Interactive line chart showing:
- **Profit/Loss at expiry** — filled area (green above zero, red below)
- **Current P&L** — dashed line showing theoretical P&L at current date
- **Breakeven points** — vertical dotted lines with labels
- **Max profit / max loss** — horizontal dotted lines

X-axis: underlying price range (±20% from current)
Y-axis: dollar P&L

Interactive tooltip on hover shows: price, expiry P&L, current P&L.

## Volatility Surface Screen

```
┌────────────────────────────────────────────────────┐
│  AAPL Volatility Surface  [Last rebuild: 14s ago]  │
├────────────────────────────────────────────────────┤
│                                                    │
│   [Interactive 3D Plotly surface]                  │
│   X: Strike   Y: Expiry (days)   Z: Implied Vol %  │
│                                                    │
│   Drag to rotate · Scroll to zoom · Click for IV   │
│                                                    │
├────────────────────────────────────────────────────┤
│  IV Term Structure   │  Skew (30-delta)            │
│  [line chart]        │  [line chart]               │
└────────────────────────────────────────────────────┘
```

## Greeks Dashboard

Real-time aggregated Greeks across all open option positions:

```
┌─────────────────────────────────────────────────────┐
│  Portfolio Greeks                                   │
├──────────┬──────────┬──────────┬──────────┬────────┤
│  Net Δ   │  Net Γ   │  Net Θ   │  Net ν   │  Net ρ │
│  +2,450  │  +183    │  −$847   │  +12,400 │  +6,300│
│ shares   │ contracts│   /day   │  per vol │  per % │
├──────────┴──────────┴──────────┴──────────┴────────┤
│  Vega by Expiry                                     │
│  ████████████ May: +4,200                           │
│  ████████ Jun: +3,100                               │
│  ████ Jul: +1,800                                   │
│  ██ Sep: +1,300                                     │
└─────────────────────────────────────────────────────┘
```

## IV Rank / IV Percentile Widget

```
┌───────────────────────────┐
│  IV Rank    42            │
│  ┤──────█──────────────├  │
│  0          52-wk range   │
│                           │
│  IV Percentile   38%      │
│  Current IV      28.4%    │
│  52-wk Low       18.1%    │
│  52-wk High      68.3%    │
└───────────────────────────┘
```

Green when IV Rank < 30 (cheap vol, favour buying), red when > 70 (expensive, favour selling).
