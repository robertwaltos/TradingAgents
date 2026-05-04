# Database Schema Reference

## TimescaleDB Hypertables

### tick_data
All raw trade ticks from all asset classes.

```sql
CREATE TABLE tick_data (
    time          TIMESTAMPTZ  NOT NULL,
    symbol        TEXT         NOT NULL,
    asset_class   TEXT         NOT NULL,   -- 'equity' | 'future' | 'forex' | 'crypto' | 'bond'
    price         NUMERIC(18,8) NOT NULL,
    size          NUMERIC(18,4),
    exchange      TEXT,
    conditions    TEXT[],                  -- e.g. ARRAY['regular', 'late']
    source        TEXT                     -- 'polygon' | 'ibkr' | 'binance' | ...
);
SELECT create_hypertable('tick_data', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON tick_data (symbol, time DESC);
CREATE INDEX ON tick_data (asset_class, time DESC);
```

### options_data
Full options chain snapshots (one row per contract per snapshot time).

```sql
CREATE TABLE options_data (
    time          TIMESTAMPTZ  NOT NULL,
    underlying    TEXT         NOT NULL,
    occ_symbol    TEXT         NOT NULL,   -- OCC standard option symbol
    expiry        DATE         NOT NULL,
    strike        NUMERIC(10,2) NOT NULL,
    option_type   CHAR(1)      NOT NULL,   -- 'C' or 'P'
    bid           NUMERIC(10,4),
    ask           NUMERIC(10,4),
    last          NUMERIC(10,4),
    volume        INTEGER,
    open_interest INTEGER,
    iv            NUMERIC(8,6),
    delta         NUMERIC(8,6),
    gamma         NUMERIC(8,6),
    theta         NUMERIC(8,6),
    vega          NUMERIC(8,6),
    rho           NUMERIC(8,6),
    underlying_price NUMERIC(12,4)
);
SELECT create_hypertable('options_data', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON options_data (underlying, expiry, strike, option_type, time DESC);
```

### futures_data
Futures contract ticks and daily settlement.

```sql
CREATE TABLE futures_data (
    time              TIMESTAMPTZ  NOT NULL,
    root_symbol       TEXT         NOT NULL,   -- e.g. 'ES', 'CL', 'GC'
    contract_symbol   TEXT         NOT NULL,   -- e.g. 'ESM24'
    expiry            DATE         NOT NULL,
    price             NUMERIC(14,4) NOT NULL,
    volume            INTEGER,
    open_interest     INTEGER,
    settlement        NUMERIC(14,4),
    basis             NUMERIC(14,4)            -- futures price - spot price
);
SELECT create_hypertable('futures_data', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON futures_data (root_symbol, expiry, time DESC);
```

### crypto_metrics
On-chain metrics and DeFi data (daily granularity from Glassnode).

```sql
CREATE TABLE crypto_metrics (
    date              DATE         NOT NULL,
    symbol            TEXT         NOT NULL,
    active_addresses  BIGINT,
    transaction_vol   NUMERIC(24,2),
    nvt               NUMERIC(12,4),
    mvrv              NUMERIC(10,4),
    s2f               NUMERIC(10,4),
    exchange_inflow   NUMERIC(24,2),
    exchange_outflow  NUMERIC(24,2),
    funding_rate      NUMERIC(10,6),           -- perp funding rate (8h)
    long_short_ratio  NUMERIC(8,4),
    fear_greed_index  SMALLINT,
    PRIMARY KEY (date, symbol)
);
```

## Application Tables

### accounts
```sql
CREATE TABLE accounts (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id),
    name          TEXT         NOT NULL,
    broker        TEXT,                        -- 'ibkr' | 'paper' | 'manual'
    currency      CHAR(3)      NOT NULL DEFAULT 'USD',
    cash_balance  NUMERIC(18,4) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  DEFAULT now(),
    UNIQUE(user_id, name)
);
```

### positions
```sql
CREATE TABLE positions (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID         NOT NULL REFERENCES accounts(id),
    symbol        TEXT         NOT NULL,
    asset_class   TEXT         NOT NULL,
    quantity      NUMERIC(18,8) NOT NULL,
    avg_cost      NUMERIC(18,8) NOT NULL,
    opened_at     TIMESTAMPTZ  DEFAULT now(),
    closed_at     TIMESTAMPTZ,
    metadata      JSONB,
    -- Options-specific columns (null for non-options)
    expiry        DATE,
    strike        NUMERIC(10,2),
    option_type   CHAR(1)
);
CREATE INDEX ON positions (account_id, closed_at NULLS FIRST);
```

### trades (immutable ledger)
```sql
CREATE TABLE trades (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID         NOT NULL REFERENCES accounts(id),
    position_id   UUID         REFERENCES positions(id),
    side          TEXT         NOT NULL,    -- 'buy' | 'sell'
    quantity      NUMERIC(18,8) NOT NULL,
    price         NUMERIC(18,8) NOT NULL,
    commission    NUMERIC(10,4) DEFAULT 0,
    executed_at   TIMESTAMPTZ  NOT NULL,
    source        TEXT,                     -- 'manual' | 'algo' | 'agent'
    broker_ref    TEXT                      -- broker's own trade ID
);
```

### watchlists
```sql
CREATE TABLE watchlists (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id),
    name          TEXT         NOT NULL,
    symbols       TEXT[]       NOT NULL DEFAULT '{}',
    updated_at    TIMESTAMPTZ  DEFAULT now()
);
```

### alerts
```sql
CREATE TABLE alerts (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID         NOT NULL REFERENCES accounts(id),
    alert_type    TEXT         NOT NULL,   -- 'price' | 'greek' | 'pnl' | 'risk'
    symbol        TEXT,
    condition     JSONB        NOT NULL,   -- {"field": "delta", "op": ">", "value": 0.8}
    message       TEXT         NOT NULL,
    triggered_at  TIMESTAMPTZ,
    acknowledged  BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMPTZ  DEFAULT now()
);
```

### agent_decision_log
```sql
CREATE TABLE agent_decision_log (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    TEXT         NOT NULL,
    agent_name    TEXT         NOT NULL,
    asset_class   TEXT,
    symbol        TEXT,
    action        TEXT,
    rationale     TEXT,
    confidence    NUMERIC(4,3),
    metadata      JSONB,
    created_at    TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX ON agent_decision_log (session_id, created_at DESC);
```

## Migrations

Managed with **Alembic**. Migration files in `alembic/versions/`. Never edit applied migrations — always create a new one.

```bash
# Generate new migration
alembic revision --autogenerate -m "add_alerts_table"

# Apply all pending migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```
