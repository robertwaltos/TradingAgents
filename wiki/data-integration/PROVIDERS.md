# Data Provider Integration

## Provider Registry

| Asset | Primary | Fallback | Protocol | Est. Monthly Cost |
|-------|---------|---------|---------|-------------------|
| Equities | Polygon.io | Alpha Vantage | WebSocket | $1,500 |
| Options | Interactive Brokers TWS | Tradier | TWS API (TCP) | $2,500 |
| Futures | CME DataMine | Quandl / Nasdaq DL | REST | $1,500 |
| Forex | OANDA | FXCM | WebSocket | $800 |
| Crypto | Binance | Coinbase Advanced | WebSocket | $500 |
| Bonds/Macro | FRED | Treasury Direct | REST | $0 |
| News/Sentiment | Benzinga | Alpaca News API | WebSocket | $500 |
| On-chain | Glassnode | The Graph | REST / GraphQL | $200 |

**Total data spend: ~$7,500 / month**

## Integration Details

### Polygon.io (Equities)

```python
class PolygonAdapter:
    WS_URL = "wss://socket.polygon.io/stocks"

    async def connect(self, symbols: list[str]):
        async with websockets.connect(self.WS_URL) as ws:
            await ws.send(json.dumps({"action": "auth", "params": self.api_key}))
            await ws.send(json.dumps({
                "action": "subscribe",
                "params": ",".join(f"T.{s}" for s in symbols),  # Trades
            }))
            async for raw in ws:
                events = json.loads(raw)
                for event in events:
                    if event["ev"] == "T":
                        yield TickEvent(
                            symbol=event["sym"],
                            price=event["p"],
                            size=event["s"],
                            time=datetime.fromtimestamp(event["t"] / 1000),
                        )
```

Key events: `T` (trade), `Q` (quote), `A` (aggregate/bar per second)

### Interactive Brokers TWS (Options)

IBKR uses a proprietary callback-based API. Bridging pattern:

```python
import asyncio
from ibapi.client import EClient
from ibapi.wrapper import EWrapper

class IBKRBridge(EWrapper, EClient):
    def __init__(self, queue: asyncio.Queue):
        EClient.__init__(self, self)
        self._queue = queue
        self._loop = asyncio.get_event_loop()

    def tickPrice(self, reqId, tickType, price, attrib):
        self._loop.call_soon_threadsafe(
            self._queue.put_nowait,
            {"req_id": reqId, "tick_type": tickType, "price": price}
        )

    def tickOptionComputation(self, reqId, tickType, tickAttrib, impliedVol,
                              delta, optPrice, pvDividend, gamma, vega, theta, undPrice):
        self._loop.call_soon_threadsafe(
            self._queue.put_nowait,
            {"req_id": reqId, "delta": delta, "gamma": gamma, "theta": theta,
             "vega": vega, "iv": impliedVol}
        )
```

IBKR provides real-time model Greeks — no need to recompute locally for most use cases. Local Black-Scholes Greeks used as cross-check and for speed when IBKR data is delayed.

### Binance (Crypto)

Multi-stream subscription:
```python
symbols = ["btcusdt", "ethusdt", "solusdt"]
streams = [f"{s}@trade" for s in symbols] + [f"{s}@markPrice" for s in symbols]
url = f"wss://stream.binance.com:9443/stream?streams={'/'.join(streams)}"
```

HMAC-SHA256 signing for authenticated endpoints (account data, order placement):
```python
import hmac, hashlib
def sign(params: dict, secret: str) -> str:
    query = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    return hmac.new(secret.encode(), query.encode(), hashlib.sha256).hexdigest()
```

### FRED (Bonds/Macro)

```python
async def get_fred_series(series_id: str, limit: int = 252) -> list[FREDObservation]:
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,
    }
    async with httpx.AsyncClient(verify=certifi.where()) as client:
        resp = await client.get(url, params=params, timeout=10.0)
        resp.raise_for_status()
        return [FREDObservation(**obs) for obs in resp.json()["observations"]]
```

Key series for bond analysis:

| Series ID | Description |
|-----------|-------------|
| `DGS2` | 2-Year Treasury Constant Maturity |
| `DGS5` | 5-Year Treasury Constant Maturity |
| `DGS10` | 10-Year Treasury Constant Maturity |
| `DGS30` | 30-Year Treasury Constant Maturity |
| `FEDFUNDS` | Effective Federal Funds Rate |
| `T10YIE` | 10-Year Breakeven Inflation Rate |
| `BAMLH0A0HYM2` | ICE BofA High Yield OAS |
| `BAMLC0A0CM` | ICE BofA IG Corporate OAS |

## Failover Logic

```python
class ProviderConnectionManager:
    FAILOVER_TIMEOUT = 5.0  # seconds

    async def connect(self, asset_class: str) -> DataProvider:
        primary = self.providers[asset_class]["primary"]
        fallback = self.providers[asset_class]["fallback"]
        try:
            await asyncio.wait_for(primary.connect(), self.FAILOVER_TIMEOUT)
            logger.info(f"{asset_class}: connected to primary {primary.name}")
            return primary
        except (asyncio.TimeoutError, ConnectionError) as e:
            logger.warning(f"{asset_class}: primary failed ({e}), switching to {fallback.name}")
            await fallback.connect()
            return fallback
```

Reconnection is automatic with exponential backoff: 1s → 2s → 4s → 8s → 30s (cap).

## API Key Management

All API keys in environment variables, never hardcoded. Schema:

```
POLYGON_API_KEY=...
IBKR_CLIENT_ID=...
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
OANDA_API_KEY=...
FRED_API_KEY=...
BENZINGA_API_KEY=...
GLASSNODE_API_KEY=...
```

Loaded via `KoydoConfig.from_environment()` at startup. Secret rotation handled via Kubernetes Secrets (mounted as env vars, not files).
