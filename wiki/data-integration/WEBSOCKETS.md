# WebSocket Architecture

## Fan-Out Design

```
Market Data Sources
    │ WebSocket / TWS / REST
    ▼
Ingestion Adapters (per provider)
    │ publish to Kafka
    ▼
Kafka Topics (one per symbol per asset class)
    │ consume
    ▼
Redis Pub/Sub (one channel per symbol)
    │ subscribe
    ▼
WebSocket Gateway (Socket.io, multi-node)
    │ emit to subscribed clients
    ▼
iOS App · macOS App · Web Browser
```

No direct connection from client to Kafka. No direct connection from Kafka consumer to client WebSocket. Redis is the decoupling layer that makes horizontal scaling of the WebSocket gateway possible.

## WebSocket Gateway (FastAPI + Socket.io)

```python
import socketio
from fastapi import FastAPI
from redis.asyncio import Redis

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()
socket_app = socketio.ASGIApp(sio, app)

redis: Redis

@sio.event
async def connect(sid, environ, auth):
    token = auth.get("token")
    if not await verify_jwt(token):
        raise socketio.exceptions.ConnectionRefusedError("Unauthorized")

@sio.event
async def subscribe(sid, data: dict):
    symbols = data.get("symbols", [])
    for symbol in symbols:
        await sio.enter_room(sid, f"quote:{symbol}")

@sio.event
async def unsubscribe(sid, data: dict):
    for symbol in data.get("symbols", []):
        await sio.leave_room(sid, f"quote:{symbol}")

@sio.event
async def disconnect(sid):
    pass  # Socket.io handles room cleanup automatically

async def redis_to_clients():
    """Relay Redis pub/sub messages to Socket.io rooms."""
    pubsub = redis.pubsub()
    await pubsub.psubscribe("quote:*")  # Subscribe to all quote channels
    async for msg in pubsub.listen():
        if msg["type"] == "pmessage":
            channel = msg["channel"].decode()   # e.g. "quote:AAPL"
            await sio.emit("data", msg["data"], room=channel)
```

## Client-Side Subscriptions

### TypeScript (Web)

```typescript
const socket = io(WS_URL, {
  auth: { token: getJWT() },
  transports: ['websocket'],   // Force WebSocket, skip polling
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30_000,
  reconnectionAttempts: Infinity,
});

// Subscribe to real-time quotes
socket.emit('subscribe', { symbols: ['AAPL', 'SPY', 'TSLA'] });

// Receive updates
socket.on('data', (payload: QuoteUpdate) => {
  store.updateQuote(payload);
});

// Cleanup
return () => {
  socket.emit('unsubscribe', { symbols: ['AAPL', 'SPY', 'TSLA'] });
};
```

### Swift (iOS/macOS)

```swift
class WebSocketManager: ObservableObject {
    private var socket: URLSessionWebSocketTask?

    func subscribe(symbols: [String]) {
        var request = URLRequest(url: URL(string: "\(WS_BASE_URL)/ws/quotes")!)
        request.setValue("Bearer \(authManager.jwt)", forHTTPHeaderField: "Authorization")
        socket = URLSession.shared.webSocketTask(with: request)
        socket?.resume()

        // Send subscription message
        let msg = try! JSONEncoder().encode(["action": "subscribe", "symbols": symbols])
        socket?.send(.data(msg)) { _ in }
        receiveLoop()
    }

    private func receiveLoop() {
        socket?.receive { [weak self] result in
            if case .success(let message) = result,
               case .data(let data) = message,
               let update = try? JSONDecoder().decode(QuoteUpdate.self, from: data) {
                DispatchQueue.main.async { self?.latestUpdate = update }
            }
            self?.receiveLoop()
        }
    }
}
```

## Message Schemas

### Quote Update
```json
{
  "type": "quote",
  "symbol": "AAPL",
  "bid": 182.44,
  "ask": 182.46,
  "last": 182.45,
  "change": 1.23,
  "change_pct": 0.68,
  "volume": 48201345,
  "ts": 1714600012345
}
```

### Options Chain Update
```json
{
  "type": "options_chain",
  "underlying": "AAPL",
  "expiry": "2024-05-17",
  "contracts": [
    {
      "symbol": "AAPL240517C00182000",
      "strike": 182,
      "type": "call",
      "bid": 2.25,
      "ask": 2.40,
      "greeks": {"delta": 0.524, "gamma": 0.018, "theta": -0.047, "vega": 0.285, "iv": 0.324}
    }
  ],
  "ts": 1714600012345
}
```

## Latency Budget

| Hop | Target | Notes |
|-----|--------|-------|
| Market data → Kafka | < 5ms | WebSocket adapter, async send |
| Kafka → Redis pub/sub | < 10ms | Single consumer, direct publish |
| Redis → Socket.io emit | < 2ms | In-process |
| Socket.io → browser | < 30ms | CDN edge node |
| **Total end-to-end** | **< 50ms** | Global CDN target |

## Scaling

Each Socket.io node is stateless — it subscribes to Redis pub/sub and emits to connected clients. Scale out with more pods; Redis handles fan-out coordination automatically.

```yaml
# K8s HPA for WebSocket gateway
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 60 }
  - type: Pods
    pods:
      metric: { name: connected_clients }
      target: { type: AverageValue, averageValue: "500" }
```
