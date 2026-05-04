# SwiftUI Implementation Guide

## App Structure

```
TradingAgentsApp/
├── TradingAgentsApp.swift          # @main entry
├── ContentView.swift               # Root tab/navigation
├── Core/
│   ├── Network/
│   │   ├── APIClient.swift         # URLSession + async/await
│   │   └── WebSocketManager.swift  # Combine-based WS
│   ├── Models/                     # Codable structs mirroring API
│   └── Auth/                       # Keychain, JWT storage
├── Features/
│   ├── Portfolio/
│   ├── Options/
│   ├── Charts/
│   ├── Scanner/
│   └── Settings/
└── DesignSystem/
    ├── Colors.swift
    ├── Typography.swift
    └── Components/
```

## WebSocket with Combine

```swift
class WebSocketManager: ObservableObject {
    private var socket: URLSessionWebSocketTask?
    private var cancellables = Set<AnyCancellable>()

    @Published var latestQuote: Quote?

    func connect(symbols: [String]) {
        let url = URL(string: "wss://api.tradingagents.io/ws/quotes")!
        socket = URLSession.shared.webSocketTask(with: url)
        socket?.resume()
        receiveMessage()
        subscribe(symbols: symbols)
    }

    private func receiveMessage() {
        socket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                if case .string(let text) = message,
                   let data = text.data(using: .utf8),
                   let quote = try? JSONDecoder().decode(Quote.self, from: data) {
                    DispatchQueue.main.async { self?.latestQuote = quote }
                }
                self?.receiveMessage()  // recurse
            case .failure(let error):
                print("WS error: \(error)")
            }
        }
    }
}
```

## Swift Charts Integration

```swift
struct EquityPriceChart: View {
    let candles: [OHLCV]

    var body: some View {
        Chart(candles) { candle in
            RectangleMark(
                x: .value("Time", candle.time),
                yStart: .value("Low", candle.low),
                yEnd: .value("High", candle.high),
                width: 2
            )
            .foregroundStyle(candle.close >= candle.open ? .green : .red)

            RectangleMark(
                x: .value("Time", candle.time),
                yStart: .value("Open", min(candle.open, candle.close)),
                yEnd: .value("Close", max(candle.open, candle.close)),
                width: 8
            )
            .foregroundStyle(candle.close >= candle.open ? .green : .red)
        }
        .chartXAxis { AxisMarks(values: .stride(by: .hour)) }
        .chartYScale(domain: .automatic(includesZero: false))
        .frame(height: 300)
    }
}
```

## Options Chain View

```swift
struct OptionsChainView: View {
    @StateObject private var vm = OptionsChainViewModel()

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                // Expiry picker
                ExpiryPickerView(dates: vm.expirations, selected: $vm.selectedExpiry)

                // Calls | Strike | Puts header
                OptionsChainHeaderRow()

                // Chain rows
                ForEach(vm.strikes) { strike in
                    OptionsChainRow(
                        call: vm.call(strike: strike),
                        put: vm.put(strike: strike),
                        strikePrice: strike,
                        atmStrike: vm.atmStrike
                    )
                }
            }
        }
        .task { await vm.load() }
    }
}
```

## Real-Time Greeks Display

```swift
struct GreeksView: View {
    let greeks: Greeks

    var body: some View {
        Grid(horizontalSpacing: 24, verticalSpacing: 8) {
            GridRow {
                GreekCell(label: "Delta", value: greeks.delta, format: ".3f")
                GreekCell(label: "Gamma", value: greeks.gamma, format: ".4f")
                GreekCell(label: "Theta", value: greeks.theta, format: ".2f")
            }
            GridRow {
                GreekCell(label: "Vega", value: greeks.vega, format: ".3f")
                GreekCell(label: "Rho", value: greeks.rho, format: ".3f")
                GreekCell(label: "IV", value: greeks.iv * 100, format: ".1f", suffix: "%")
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(12)
    }
}
```

## Navigation Architecture

```swift
// Uses NavigationStack (iOS 16+) — not NavigationView
NavigationStack(path: $navigationPath) {
    DashboardView()
        .navigationDestination(for: Route.self) { route in
            switch route {
            case .optionsChain(let symbol): OptionsChainView(symbol: symbol)
            case .chart(let symbol, let tf): ChartView(symbol: symbol, timeframe: tf)
            case .strategy(let legs): StrategyAnalyzerView(legs: legs)
            }
        }
}
```

## Performance Notes

- `LazyVStack` / `LazyHStack` for all scrollable lists — critical for options chains with 1000+ rows
- `@Observable` (Swift 5.9 macro) preferred over `@ObservableObject` for new ViewModels
- Quote updates arrive via Combine `@Published` on background thread → always dispatch to main
- Swift Charts renders natively at 120fps on ProMotion displays with no extra configuration
- Image assets use `@2x`/`@3x` asset catalogs; chart backgrounds use CoreImage-generated gradients
