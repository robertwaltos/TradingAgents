# React Web Frontend

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15 (App Router) |
| Language | TypeScript | 5.x strict |
| Styling | Tailwind CSS | v4 |
| State | Zustand | 4.x |
| Server state | TanStack Query | 5.x |
| Charts | TradingView Lightweight Charts | 4.x |
| 3D / Vol surface | Plotly.js | 2.x |
| WebSocket | Socket.io client | 4.x |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, auth provider
│   ├── dashboard/page.tsx
│   ├── options/page.tsx
│   ├── futures/page.tsx
│   └── api/                    # Next.js API routes (proxy to FastAPI)
├── components/
│   ├── charts/
│   │   ├── CandlestickChart.tsx
│   │   ├── VolatilitySurface3D.tsx
│   │   └── GreeksChart.tsx
│   ├── options/
│   │   ├── OptionsChain.tsx
│   │   ├── StrategyBuilder.tsx
│   │   └── PayoffDiagram.tsx
│   └── shared/
├── hooks/
│   ├── useWebSocket.ts
│   ├── useOptionsChain.ts
│   └── useGreeks.ts
├── stores/
│   ├── portfolio.store.ts
│   └── watchlist.store.ts
└── lib/
    ├── api.ts                  # Typed fetch wrappers
    └── websocket.ts
```

## TradingView Chart Integration

```tsx
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export function CandlestickChart({ symbol, timeframe }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0f1117' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    // Fetch + stream data
    fetchCandles(symbol, timeframe).then(data => series.setData(data));

    return () => chart.remove();
  }, [symbol, timeframe]);

  return <div ref={containerRef} className="w-full h-96" />;
}
```

## Volatility Surface (Plotly 3D)

```tsx
import Plot from 'react-plotly.js';

export function VolatilitySurface({ surface }: { surface: VolSurfaceData }) {
  return (
    <Plot
      data={[{
        type: 'surface',
        x: surface.strikes,
        y: surface.expiries,
        z: surface.ivGrid,
        colorscale: 'Viridis',
        showscale: true,
        colorbar: { title: 'IV %' },
      }]}
      layout={{
        paper_bgcolor: '#0f1117',
        scene: {
          xaxis: { title: 'Strike', gridcolor: '#1f2937' },
          yaxis: { title: 'Expiry (days)', gridcolor: '#1f2937' },
          zaxis: { title: 'Implied Vol %', gridcolor: '#1f2937' },
          bgcolor: '#0f1117',
        },
        margin: { l: 0, r: 0, t: 0, b: 0 },
      }}
      style={{ width: '100%', height: '500px' }}
    />
  );
}
```

## WebSocket Hook

```tsx
export function useWebSocket<T>(channel: string): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      transports: ['websocket'],
      reconnectionDelay: 1000,
    });

    socket.emit('subscribe', channel);
    socket.on('data', (payload: T) => setData(payload));

    return () => { socket.emit('unsubscribe', channel); socket.disconnect(); };
  }, [channel]);

  return data;
}
```

## TanStack Query for Options Chain

```tsx
export function useOptionsChain(symbol: string, expiry: string) {
  return useQuery({
    queryKey: ['options-chain', symbol, expiry],
    queryFn: () => api.get<OptionsChain>(`/options/chain/${symbol}?expiry=${expiry}`),
    staleTime: 30_000,     // Treat as fresh for 30s
    refetchInterval: 30_000, // Poll every 30s as fallback
  });
}
```

## Zustand Portfolio Store

```tsx
interface PortfolioStore {
  positions: Position[];
  totalValue: number;
  dailyPnL: number;
  addPosition: (p: Position) => void;
  removePosition: (id: string) => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  positions: [],
  totalValue: 0,
  dailyPnL: 0,
  addPosition: (p) => set(state => ({ positions: [...state.positions, p] })),
  removePosition: (id) => set(state => ({ positions: state.positions.filter(x => x.id !== id) })),
}));
```

## Dark Theme Design Tokens

```typescript
// tailwind.config.ts
const colors = {
  surface: {
    base: '#0f1117',
    raised: '#161b22',
    overlay: '#1f2937',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },
  profit: '#10b981',   // emerald-500
  loss: '#ef4444',     // red-500
  neutral: '#f59e0b',  // amber-500
  accent: '#6366f1',   // indigo-500
};
```
