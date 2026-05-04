# Mobile & Desktop Native UI

## Platform Targets

| Platform | Framework | Min OS |
|----------|-----------|--------|
| iPhone | SwiftUI | iOS 16 |
| iPad | SwiftUI | iPadOS 16 |
| Mac | SwiftUI (native, not Catalyst) | macOS 13 |

## Navigation Architecture

### iPhone
```
TabView {
    DashboardView()         .tabItem { Label("Portfolio", systemImage: "briefcase") }
    WatchlistView()         .tabItem { Label("Markets", systemImage: "chart.line.uptrend.xyaxis") }
    OptionsChainView()      .tabItem { Label("Options", systemImage: "arrow.up.arrow.down.circle") }
    ScannerView()           .tabItem { Label("Scanner", systemImage: "magnifyingglass.circle") }
    SettingsView()          .tabItem { Label("Settings", systemImage: "gearshape") }
}
```

### iPad / macOS (NavigationSplitView)
```
NavigationSplitView {
    // Sidebar (macOS) / Primary column (iPad)
    List(sidebarItems) { item in
        NavigationLink(value: item) { SidebarRow(item) }
    }
} detail: {
    // Detail pane
    switch selection {
    case .dashboard:     DashboardView()
    case .options(let s): OptionsChainView(symbol: s)
    case .chart(let s):  ChartView(symbol: s)
    }
}
```

## Key Screens

### Dashboard (iPhone)
```
┌─────────────────────────────┐
│  Portfolio                  │
│  $248,300.44  +$1,842 +0.7% │
├─────────────────────────────┤
│  [Mini Portfolio Chart]     │
│  [30-day sparkline]         │
├─────────────────────────────┤
│  Positions                  │
│  AAPL  100sh  +$284 +1.2%   │
│  SPY May182C  +$340 +18.4%  │
│  BTC   0.5   −$120 −2.1%   │
│  [Show all 12 positions]    │
├─────────────────────────────┤
│  Alerts (3)                 │
│  ⚠ SPY delta >0.80          │
│  ⚠ AAPL IV spike detected   │
└─────────────────────────────┘
```

### Options Chain (iPhone)
Landscape orientation preferred. Portrait shows calls and puts stacked:
```
Expiry: [May 17] [Jun 21] [Jul 19]

CALLS                  PUTS
Bid  Ask   OI │Strike│ Bid  Ask   OI
─────────────────────────────────
2.25 2.40 15K │ 182  │ 2.35 2.50 12K  ← ATM
```

Tap any row → contract sheet slides up from bottom.

### Chart (iPhone)
Full-screen chart. Double-tap to cycle timeframe. Pinch to zoom. Long-press for crosshair.

Toolbar:
- Timeframe selector (1m · 5m · 1h · 1D · 1W)
- Indicator picker (EMA, BB, MACD, RSI)
- Drawing mode (trend line, support/resistance)
- Share (screenshot to Photos / export CSV)

## Widgets (iOS WidgetKit)

| Widget | Size | Content |
|--------|------|---------|
| Portfolio Value | Small | Total value + daily % |
| Watchlist | Medium | 4-6 symbols with prices |
| Alerts | Medium | Latest 3 risk alerts |
| Options Expiry Countdown | Small | Days to nearest expiry |

## Watch App (watchOS)

- Portfolio value glance
- Daily P&L
- Top mover in watchlist
- Alert haptic on threshold breach

```swift
struct WatchDashboard: View {
    @Query var positions: [Position]

    var body: some View {
        VStack {
            Text(totalValue, format: .currency(code: "USD"))
                .font(.title3.monospacedDigit())
            Text(dailyPnL >= 0 ? "+\(dailyPnL, format: .currency(code: "USD"))" : "\(dailyPnL, format: .currency(code: "USD"))")
                .foregroundStyle(dailyPnL >= 0 ? .green : .red)
        }
    }
}
```

## Haptics

| Event | Haptic Type |
|-------|-------------|
| Trade executed | Success notification |
| Risk alert triggered | Warning notification |
| Price target reached | Rigid impact |
| Tab switch | Light impact |
| Pull to refresh | Selection changed |

## Dark Mode

Dark mode only. `preferredColorScheme(.dark)` set at root. System accent colour overridden with indigo (`Color.indigo`).

## Accessibility

- All prices have `accessibilityLabel` with formatted value and direction ("Apple, up 1.2 percent")
- Charts have `accessibilityHidden(true)` with a summary `accessibilityLabel` below
- All interactive elements have `accessibilityHint`
- Minimum tap target: 44×44 pt
- Support for Dynamic Type (scales from xSmall to xxxLarge)
