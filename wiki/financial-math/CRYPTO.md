# Crypto Analytics

## On-Chain Metrics

### NVT Ratio (Network Value to Transactions)
```
NVT = Market Cap / Daily On-Chain Transaction Volume (USD)
```
Analogous to P/E for equities. High NVT (>90) = overvalued vs transaction activity.

### Mayer Multiple
```
Mayer Multiple = Current Price / 200-day SMA
```
| Value | Signal |
|-------|--------|
| < 0.8 | Historical accumulation zone |
| 0.8 – 1.5 | Fair value range |
| > 2.4 | Historical distribution / overheated |

### Stock-to-Flow (S2F)
```
S2F = Circulating Supply / Annual New Issuance
```
Used primarily for Bitcoin. Higher S2F = greater scarcity.

### MVRV Ratio
```
MVRV = Market Cap / Realised Cap
```
Realised Cap = sum of each coin's value at time of last movement. MVRV > 3.5 = high unrealised profit → sell pressure risk.

## DeFi Analytics

| Metric | Formula | Use |
|--------|---------|-----|
| **TVL** | Σ(token_balance × token_price) | Protocol adoption |
| **TVL Ratio** | Market Cap / TVL | Over/undervaluation |
| **APY** | (1 + r_periodic)^n − 1 | Yield farming returns |
| **IL** | 2√(price_ratio) / (1 + price_ratio) − 1 | Impermanent loss |
| **Token Velocity** | Transaction Vol / Market Cap | Adoption/speculation split |

### Impermanent Loss (AMM Pools)
```python
def impermanent_loss(price_ratio: float) -> float:
    """IL as a fraction for a 50/50 AMM pool."""
    return 2 * (price_ratio ** 0.5) / (1 + price_ratio) - 1
```

## Sentiment Indicators

| Indicator | Source | Interpretation |
|-----------|--------|----------------|
| **Fear & Greed Index** | Alternative.me | 0=Extreme Fear, 100=Extreme Greed |
| **Funding Rate** | Binance Perps | Positive = longs paying shorts |
| **Long/Short Ratio** | Binance | >1 = more longs open |
| **Social Volume** | LunarCrush | Rising = retail attention |
| **Exchange Flows** | Glassnode | Net inflow = selling pressure |

## Volatility Regime

Crypto volatility is regime-dependent:
- **Accumulation:** low vol, tight range
- **Breakout:** vol spike, directional move
- **Distribution:** high vol, choppy

Realised vol calculated on 24h rolling window (crypto trades 24/7 — annualise with √365, not √252).

## Asset Coverage

| Category | Assets |
|----------|--------|
| **L1** | BTC, ETH, SOL, ADA, AVAX |
| **L2** | ARB, OP, MATIC, BASE |
| **DeFi** | UNI, AAVE, CRV, MKR |
| **Stables** | USDT, USDC, DAI |
| **Memes** | DOGE, SHIB (sentiment only) |

## Data Providers

| Provider | Use | Auth |
|----------|-----|------|
| **Binance** | Price, OB, funding rate, L/S ratio | API key + HMAC-SHA256 |
| **Glassnode** | NVT, MVRV, exchange flows, active addresses | API key |
| **The Graph** | DeFi TVL, protocol state (on-chain queries) | GraphQL, no auth |
| **CoinGecko** | Market cap, S2F, social metrics | Free tier |

## Implementation Notes

- All prices denominated in USD; BTC cross-rates calculated dynamically
- Annualised vol uses √365 (crypto is 24/7)
- DeFi yields refreshed every 5 minutes from The Graph subgraphs
- Exchange flow data from Glassnode has 24h lag — not used for intraday signals
- Funding rate polled every 8 hours (Binance settlement cadence)
