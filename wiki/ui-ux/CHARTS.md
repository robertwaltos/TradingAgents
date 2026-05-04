# Charts Reference

## Charting Libraries

| Platform | Library | Use Case |
|----------|---------|---------|
| Web | TradingView Lightweight Charts | Candlestick, OHLCV, indicators |
| Web | Plotly.js | 3D volatility surface, correlation heatmap |
| Web | D3.js (custom) | Payoff diagrams, yield curve, forward curve |
| iOS/macOS | Swift Charts | OHLCV bars, Greeks over time, P&L curves |

## Chart Types

### Candlestick Chart
Standard financial candlestick with:
- Volume bars below (60% opacity, same colour as candle body)
- Overlays: EMA(9), EMA(21), EMA(200), Bollinger Bands, VWAP
- Oscillators below: RSI(14), MACD(12,26,9), ATR(14)
- Timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W
- Drawings: trend lines, horizontal support/resistance, Fibonacci retracement

### Payoff Diagram (Options Strategy)
- X-axis: underlying price (spot −30% to +30%)
- Y-axis: P&L at expiry (USD)
- Lines: one curve per date (today, 1-week, expiry)
- Shaded zone: profit (green/emerald fill, 20% opacity), loss (red fill, 20% opacity)
- Breakeven labels as vertical tick marks

```
P&L
 ^
 │      ___________________
 │     /
$0 ────────────────────────────── Price
 │          \
 │           \___
 └─────────────────────────────►
```

### Volatility Surface (3D)
- Library: Plotly.js
- Data: `(strike, expiry_days, iv_pct)` grid, ~100 × 10 points
- Colorscale: Viridis (purple = low vol, yellow = high vol)
- Rotation: enabled (drag)
- Auto-refresh: every 30 seconds

### Yield Curve
- Library: D3.js line chart
- X-axis: tenor (1m, 3m, 6m, 1y, 2y, 5y, 10y, 30y)
- Y-axis: yield percent
- Multiple overlaid lines: current (white), 1-week ago (grey), 1-year ago (muted)
- Inversion zones: amber fill when 2Y > 10Y

### Forward Curve (Futures)
- X-axis: expiry date (contract months)
- Y-axis: price
- Colour coded: contango (red gradient) vs backwardation (green gradient)
- Roll date markers as vertical tick marks

### Correlation Heatmap
- Library: Plotly.js heatmap
- Assets on both axes
- Colour: red (−1.0) → white (0.0) → green (+1.0)
- Diagonal always = 1.0 (white)
- On hover: show exact correlation coefficient and p-value

### Greeks P&L Attribution
- Stacked bar chart: how much of daily P&L came from Delta, Gamma, Theta, Vega
- Useful for understanding whether a position performed as modelled

## Chart Configuration

### TradingView Lightweight Charts Setup
```typescript
const chart = createChart(container, {
  width: container.clientWidth,
  height: 400,
  layout: {
    background: { type: ColorType.Solid, color: '#0f1117' },
    textColor: '#9ca3af',
  },
  grid: {
    vertLines: { color: '#1f2937' },
    horzLines: { color: '#1f2937' },
  },
  crosshair: { mode: CrosshairMode.Normal },
  rightPriceScale: { borderColor: '#374151' },
  timeScale: {
    borderColor: '#374151',
    timeVisible: true,
    secondsVisible: false,
  },
});
```

### Responsive Resize
```typescript
const resizeObserver = new ResizeObserver(entries => {
  const { width } = entries[0].contentRect;
  chart.applyOptions({ width });
});
resizeObserver.observe(container);
```

## Streaming Data to Charts

WebSocket tick data is batched into 100ms windows before updating charts to avoid unnecessary renders:

```typescript
function useStreamedCandles(symbol: string, tf: string) {
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    const socket = io(WS_URL);
    let pending: Bar | null = null;
    let timer: ReturnType<typeof setInterval>;

    socket.on(`ohlcv:${symbol}:${tf}`, (bar: Bar) => { pending = bar; });

    timer = setInterval(() => {
      if (pending && seriesRef.current) {
        seriesRef.current.update(pending);
        pending = null;
      }
    }, 100);  // 10 FPS max update rate

    return () => { socket.disconnect(); clearInterval(timer); };
  }, [symbol, tf]);

  return seriesRef;
}
```

## Performance Notes

- TradingView Lightweight Charts is WebGL-accelerated — renders 100k candles smoothly
- Plotly 3D surfaces should be limited to 100×10 grid (1000 points) for smooth interaction
- D3 payoff diagrams use `canvas` not `svg` when `numPoints > 500` to avoid DOM overhead
- Chart data requested via TanStack Query with `staleTime: 0` so it always fetches fresh on mount, but uses cached data for tab switches
