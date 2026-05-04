# Database Architecture

## PostgreSQL 16 + TimescaleDB 2.16

TimescaleDB extends PostgreSQL with automatic partitioning (hypertables), continuous aggregates, and compression — all via standard SQL.

## Hypertable Design

```sql
-- Core time-series tables
CREATE TABLE tick_data (
    time          TIMESTAMPTZ NOT NULL,
    symbol        TEXT        NOT NULL,
    asset_class   TEXT        NOT NULL,  -- equity, option, future, forex, crypto, bond
    price         NUMERIC(18, 8)         NOT NULL,
    size          NUMERIC(18, 4),
    exchange      TEXT,
    conditions    TEXT[]
);
SELECT create_hypertable('tick_data', 'time',
    chunk_time_interval => INTERVAL '1 day',
    number_partitions   => 4);  -- space partition by symbol hash

-- Options-specific table (wider schema)
CREATE TABLE options_data (
    time          TIMESTAMPTZ NOT NULL,
    underlying    TEXT        NOT NULL,
    symbol        TEXT        NOT NULL,  -- OCC option symbol
    expiry        DATE        NOT NULL,
    strike        NUMERIC(10, 2)         NOT NULL,
    option_type   CHAR(1)     NOT NULL,  -- 'C' or 'P'
    bid           NUMERIC(10, 4),
    ask           NUMERIC(10, 4),
    last          NUMERIC(10, 4),
    volume        INTEGER,
    open_interest INTEGER,
    iv            NUMERIC(8, 6),
    delta         NUMERIC(8, 6),
    gamma         NUMERIC(8, 6),
    theta         NUMERIC(8, 6),
    vega          NUMERIC(8, 6)
);
SELECT create_hypertable('options_data', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON options_data (underlying, expiry, strike, option_type, time DESC);
```

## Continuous Aggregates

```sql
-- 1-minute OHLCV (real-time)
CREATE MATERIALIZED VIEW ohlcv_1m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    symbol,
    asset_class,
    first(price, time)            AS open,
    max(price)                    AS high,
    min(price)                    AS low,
    last(price, time)             AS close,
    sum(size)                     AS volume,
    count(*)                      AS tick_count
FROM tick_data
GROUP BY bucket, symbol, asset_class
WITH NO DATA;

-- Refresh policy
SELECT add_continuous_aggregate_policy('ohlcv_1m',
    start_offset => INTERVAL '10 minutes',
    end_offset   => INTERVAL '10 seconds',
    schedule_interval => INTERVAL '10 seconds');

-- Higher timeframes cascade from 1m (real aggregation of aggregates)
CREATE MATERIALIZED VIEW ohlcv_1h WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', bucket), symbol, asset_class,
    first(open, bucket), max(high), min(low), last(close, bucket), sum(volume)
FROM ohlcv_1m GROUP BY 1, 2, 3;
```

## Compression Policy

```sql
-- Compress chunks older than 7 days (~95% size reduction)
SELECT add_compression_policy('tick_data', INTERVAL '7 days');
SELECT add_compression_policy('options_data', INTERVAL '3 days');

-- Retention: drop chunks older than configured window
SELECT add_retention_policy('tick_data', INTERVAL '2 years');
SELECT add_retention_policy('options_data', INTERVAL '1 year');
```

## Application Tables (Standard PostgreSQL)

```sql
-- User accounts
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Portfolio positions
CREATE TABLE positions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID REFERENCES accounts(id),
    symbol        TEXT NOT NULL,
    asset_class   TEXT NOT NULL,
    quantity      NUMERIC(18, 8) NOT NULL,
    avg_cost      NUMERIC(18, 8) NOT NULL,
    opened_at     TIMESTAMPTZ DEFAULT now(),
    closed_at     TIMESTAMPTZ,
    metadata      JSONB         -- option-specific: strike, expiry, type
);

-- Trade history (immutable ledger)
CREATE TABLE trades (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID REFERENCES accounts(id),
    position_id   UUID REFERENCES positions(id),
    side          TEXT NOT NULL,  -- 'buy' | 'sell'
    quantity      NUMERIC(18, 8) NOT NULL,
    price         NUMERIC(18, 8) NOT NULL,
    commission    NUMERIC(10, 4) DEFAULT 0,
    executed_at   TIMESTAMPTZ NOT NULL,
    source        TEXT          -- 'manual' | 'algo' | 'agent'
);
```

## Redis Schema

```
# Quote cache
HSET quote:{symbol} bid 150.25 ask 150.26 last 150.255 ts 1714600000

# Options chain (serialised JSON, 30s TTL)
SET options_chain:{symbol}:{expiry} '<json>' EX 30

# Vol surface (serialised JSON, 30s TTL)
SET vol_surface:{symbol} '<json>' EX 30

# Rate limiting (sliding window)
ZADD rate_limit:{user_id} {now_ms} {request_id}
ZREMRANGEBYSCORE rate_limit:{user_id} 0 {window_start_ms}

# WebSocket subscriptions (pub/sub channels)
PUBLISH quote:{symbol} '<json payload>'
```

## Connection Pooling

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine(
    settings.database_url,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    echo=False,
)
```

## Performance Targets

| Query Type | Target | TimescaleDB Result |
|------------|--------|-------------------|
| Latest quote per symbol | < 1ms | ~0.2ms (Redis) |
| 1-minute OHLCV, last 1h | < 10ms | ~3ms (continuous agg) |
| Full day tick query (1M rows) | < 500ms | ~120ms (hypertable + index) |
| Options chain (all strikes, 1 expiry) | < 50ms | ~12ms (filtered index) |
| Portfolio P&L recalculation | < 100ms | ~35ms (join + latest prices) |
