# FastAPI Backend

## Service Layout

```
services/
├── analytics/          # Pricing, Greeks, vol surface
├── portfolio/          # Positions, P&L
├── risk/               # VaR, stress tests
├── ai_agents/          # LangGraph orchestration
├── options/            # Options chain, strategy builder
├── futures/            # Forward curve, roll logic
├── forex/              # Rates, carry, PPP
├── crypto/             # On-chain, DeFi
├── bonds/              # Yield curves, duration
└── gateway/            # Auth, routing, rate limiting
```

Each service follows the same internal layout:
```
service/
├── main.py             # FastAPI app, lifespan hooks
├── routers/            # APIRouter per domain
├── services/           # Business logic (pure functions / classes)
├── models/             # Pydantic request/response schemas
├── kafka/              # Producer / consumer tasks
└── tests/
```

## Application Setup

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await kafka_producer.start()
    await redis_pool.initialize()
    await analytics_engine.warmup()
    yield
    # Shutdown
    await kafka_producer.stop()
    await redis_pool.close()

app = FastAPI(
    title="TradingAgents Analytics API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

## Options Router Example

```python
from fastapi import APIRouter, Depends, HTTPException
from ..services.options_service import OptionsService
from ..models.options import OptionsChainResponse, StrategyRequest, StrategyAnalysis

router = APIRouter(prefix="/options", tags=["options"])

@router.get("/chain/{symbol}", response_model=OptionsChainResponse)
async def get_options_chain(
    symbol: str,
    expiry: str | None = None,
    svc: OptionsService = Depends(),
) -> OptionsChainResponse:
    chain = await svc.get_chain(symbol, expiry)
    if not chain:
        raise HTTPException(status_code=404, detail=f"No chain found for {symbol}")
    return chain

@router.post("/strategy/analyze", response_model=StrategyAnalysis)
async def analyze_strategy(
    req: StrategyRequest,
    svc: OptionsService = Depends(),
) -> StrategyAnalysis:
    return await svc.analyze_strategy(req.legs, req.underlying_price)
```

## WebSocket Endpoint

```python
from fastapi import WebSocket, WebSocketDisconnect
from ..kafka.consumer import KafkaConsumerManager

@router.websocket("/ws/quotes")
async def quote_stream(websocket: WebSocket):
    await websocket.accept()
    symbols = []
    try:
        # Receive subscription message first
        msg = await websocket.receive_json()
        symbols = msg.get("symbols", [])

        # Subscribe to Redis channels
        async with redis.subscribe(*[f"quote:{s}" for s in symbols]) as sub:
            async for message in sub.listen():
                if message["type"] == "message":
                    await websocket.send_text(message["data"])
    except WebSocketDisconnect:
        pass
```

## Dependency Injection

```python
from functools import lru_cache
from .settings import Settings

@lru_cache
def get_settings() -> Settings:
    return Settings()

async def get_redis(settings: Settings = Depends(get_settings)) -> Redis:
    return await Redis.from_url(settings.redis_url)

async def get_db(settings: Settings = Depends(get_settings)) -> AsyncSession:
    async with AsyncSessionLocal(settings.database_url) as session:
        yield session
```

## Middleware Stack

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .middleware.auth import JWTMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, ...)
app.add_middleware(RateLimitMiddleware, redis=redis_pool)
app.add_middleware(JWTMiddleware, public_paths=["/health", "/metrics"])
```

## Performance Configuration

```python
# Run with uvicorn + uvloop
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        loop="uvloop",      # 2x faster than asyncio default
        http="httptools",   # Faster HTTP parser
        workers=4,          # Match CPU cores
        access_log=False,   # Disable for throughput (Prometheus has metrics)
    )
```

## Key Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import Literal

class Greeks(BaseModel):
    delta: float = Field(ge=-1, le=1)
    gamma: float = Field(ge=0)
    theta: float
    vega: float = Field(ge=0)
    rho: float
    iv: float = Field(ge=0, description="Implied volatility as decimal (0.25 = 25%)")
    vanna: float = 0.0
    volga: float = 0.0
    charm: float = 0.0

class OptionContract(BaseModel):
    symbol: str
    expiry: str          # ISO date
    strike: float
    option_type: Literal['call', 'put']
    bid: float
    ask: float
    last: float
    open_interest: int
    volume: int
    greeks: Greeks
```
