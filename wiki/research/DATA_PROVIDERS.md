# Data Provider Matrix

## Provider Selection by Asset Class

| Asset Class | Primary | Fallback | WebSocket | Cost/mo |
|-------------|---------|----------|-----------|---------|
| Equities | Polygon.io | Alpha Vantage | ✅ | $1,500 |
| Options | Interactive Brokers | Tradier | ✅ | $2,500 |
| Futures | CME DataMine | Quandl/Nasdaq | ❌ (REST) | $1,500 |
| Forex | OANDA | FXCM | ✅ | $800 |
| Crypto | Binance | Coinbase | ✅ | $500 |
| Bonds/Macro | FRED (free) | Treasury Direct | ❌ (REST) | $0 |
| News/Sentiment | Benzinga | Alpaca News | ✅ | $500 |
| On-chain (crypto) | Glassnode | The Graph | ❌ | $200 |

## Provider Profiles

### Polygon.io (Equities)
- **Coverage:** All US exchanges, 40+ international
- **Latency:** ~5ms WebSocket
- **History:** 15+ years tick data
- **Key endpoint:** `wss://socket.polygon.io/stocks`
- **Auth:** Bearer token in header

### Interactive Brokers (Options)
- **Coverage:** OPRA full feed, all US listed options
- **Latency:** ~10ms
- **Greeks:** Real-time calculated by IBKR
- **Key endpoint:** TWS API (port 7497 paper / 7496 live)
- **Auth:** Client ID + account login

### Binance (Crypto)
- **Coverage:** 350+ spot pairs, 200+ futures
- **Latency:** ~3ms WebSocket
- **DeFi data:** Limited — augment with Glassnode
- **Key endpoint:** `wss://stream.binance.com:9443/ws`
- **Auth:** API key + secret (HMAC-SHA256 signed)

### FRED (Bonds/Macro)
- **Coverage:** 800,000+ time series from Federal Reserve
- **Key series:** US Treasury yields (DGS2, DGS10, DGS30), FEDFUNDS, CPI
- **Key endpoint:** `https://api.stlouisfed.org/fred/series/observations`
- **Auth:** Free API key

## Connection Manager Design

```python
class ProviderConnectionManager:
    """Manages connections to all data providers with failover."""

    FAILOVER_TIMEOUT = 5.0  # seconds before switching to fallback

    async def connect_with_failover(self, asset_class: str):
        primary = self.providers[asset_class]['primary']
        fallback = self.providers[asset_class]['fallback']
        try:
            await asyncio.wait_for(primary.connect(), self.FAILOVER_TIMEOUT)
            return primary
        except (asyncio.TimeoutError, ConnectionError):
            logger.warning(f"{asset_class}: primary failed, switching to fallback")
            await fallback.connect()
            return fallback
```
