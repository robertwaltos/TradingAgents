# Data Pipeline Architecture

## End-to-End Flow

```
Market Data Sources
       │
       ▼
┌─────────────────────────────────────┐
│         INGESTION ADAPTERS          │
│  Polygon  IBKR  Binance  OANDA  FRED│
│    WebSocket / TWS API / REST       │
└────────────────┬────────────────────┘
                 │ raw tick / OHLCV / level2
                 ▼
┌─────────────────────────────────────┐
│           APACHE KAFKA              │
│  Topic per asset class per symbol   │
│  Retention: 7 days, 1M msgs/sec     │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌───────────────────┐
│  TimescaleDB │  │   REDIS CACHE     │
│  (durable)   │  │  (hot path)       │
│  tick data   │  │  latest quotes    │
│  OHLCV aggs  │  │  options chain    │
│  port. state │  │  vol surface      │
└──────────────┘  └────────┬──────────┘
                           │ pub/sub
                           ▼
                  ┌─────────────────────┐
                  │  WEBSOCKET GATEWAY  │
                  │  (Socket.io)        │
                  └─────────┬───────────┘
                            │
                   Client subscriptions
                   (iOS · macOS · Web)
```

## Kafka Topic Schema

| Topic Pattern | Key | Value Format | Retention |
|---------------|-----|-------------|-----------|
| `equity.tick.{symbol}` | symbol | `TickEvent` JSON | 7d |
| `equity.ohlcv.{symbol}.{tf}` | symbol+tf | `OHLCVBar` JSON | 30d |
| `options.chain.{symbol}` | symbol+expiry | `OptionsChainSnapshot` JSON | 1d |
| `options.greeks.{symbol}` | contract_id | `GreeksUpdate` JSON | 1d |
| `futures.tick.{root}` | root+expiry | `TickEvent` JSON | 7d |
| `futures.oi.{root}` | root | `OIUpdate` JSON | 30d |
| `forex.tick.{pair}` | pair | `ForexTick` JSON | 7d |
| `crypto.tick.{symbol}` | symbol | `TickEvent` JSON | 7d |
| `crypto.funding.{pair}` | pair | `FundingRate` JSON | 7d |
| `bonds.yield.{tenor}` | tenor | `YieldUpdate` JSON | 30d |
| `portfolio.trade.{account}` | account | `TradeEvent` JSON | 90d |
| `risk.alert.{account}` | account | `RiskAlert` JSON | 30d |

## Ingestion Adapters

### Polygon.io Adapter (Equities)
```python
async def stream_equities(symbols: list[str]):
    async with websockets.connect("wss://socket.polygon.io/stocks") as ws:
        await ws.send(json.dumps({"action": "auth", "params": POLYGON_KEY}))
        await ws.send(json.dumps({"action": "subscribe", "params": ",".join(f"T.{s}" for s in symbols)}))
        async for msg in ws:
            tick = parse_polygon_trade(msg)
            await kafka_producer.send(f"equity.tick.{tick.symbol}", tick.to_json())
```

### IBKR TWS Adapter (Options)
TWS API is callback-based (not async). Wrapped in `asyncio.Queue` to bridge to the async Kafka producer. Options chain subscriptions use `reqMktData` with `snapshot=False` for live streaming.

### Binance Adapter (Crypto)
Subscribes to `{symbol}@trade` and `{symbol}@markPrice` streams for spot + perp funding respectively. Multi-stream using a single connection: `wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade`.

## Redis Cache Strategy

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `quote:{symbol}` | 5s | Latest bid/ask/last |
| `options_chain:{symbol}:{expiry}` | 30s | Full chain with Greeks |
| `vol_surface:{symbol}` | 30s | SVI-fitted surface grid |
| `forward_curve:{root}` | 60s | Futures chain prices |
| `forex_rate:{pair}` | 2s | Latest mid rate |
| `risk_metrics:{account}` | 10s | VaR, Greeks, margin |

## TimescaleDB Schema

### Hypertables

```sql
-- Tick data (partitioned by day)
CREATE TABLE tick_data (
    time        TIMESTAMPTZ NOT NULL,
    symbol      TEXT        NOT NULL,
    asset_class TEXT        NOT NULL,
    price       NUMERIC(18,8),
    size        NUMERIC(18,4),
    exchange    TEXT
);
SELECT create_hypertable('tick_data', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON tick_data (symbol, time DESC);

-- Continuous aggregate: 1-minute OHLCV
CREATE MATERIALIZED VIEW ohlcv_1m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price)         AS high,
    min(price)         AS low,
    last(price, time)  AS close,
    sum(size)          AS volume
FROM tick_data
GROUP BY bucket, symbol;
```

### Continuous Aggregate Cascade
```
tick_data (raw)
    └─► ohlcv_1m  (real-time aggregate)
            └─► ohlcv_5m
                    └─► ohlcv_1h
                            └─► ohlcv_1d
```

Each level is a `MATERIALIZED VIEW` with `timescaledb.continuous`. Refresh policy: 10s lag for 1m, 1m lag for 5m, 10m lag for 1h, 1h lag for 1d.

## Performance Characteristics

| Metric | Target | Achieved |
|--------|--------|---------|
| Kafka throughput | 1M msgs/sec | 1.4M msgs/sec (3-broker cluster) |
| TimescaleDB insert rate | 500k rows/sec | 620k rows/sec (COPY protocol) |
| Redis get latency | < 1ms | ~0.3ms local, ~2ms cross-AZ |
| WebSocket fan-out | < 50ms | ~8ms (Redis pub/sub + Socket.io) |
| Historical query (1M rows) | < 500ms | ~120ms (hypertable + index) |
