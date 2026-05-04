# Design System

## Philosophy

- **Dark-first:** All screens designed in dark mode. Light mode is optional, not a priority.
- **Data density:** Show maximum information without clutter. Professional traders expect compact layouts.
- **Colour as signal:** Green = profit/bullish, Red = loss/bearish, Amber = neutral/warning, Blue = informational.
- **Motion with purpose:** Animations only when they communicate state change (price flash, alert pulse). No decorative motion.

## Colour Palette

```
Background
  base      #0f1117    Root background
  raised    #161b22    Cards, panels
  overlay   #1f2937    Dropdowns, modals
  border    #374151    Dividers, outlines

Text
  primary   #f9fafb    Primary content
  secondary #9ca3af    Labels, metadata
  muted     #6b7280    Placeholders, disabled

Semantic
  profit    #10b981    Green — positive P&L, calls ITM, buy signal
  loss      #ef4444    Red — negative P&L, puts ITM, sell signal
  neutral   #f59e0b    Amber — flat, ATM, warning
  accent    #6366f1    Indigo — interactive, selected state

Chart candles
  up body   #10b981  up wick   #10b981
  down body #ef4444  down wick #ef4444
```

## Typography

```
Font family:   "Inter" (system-ui fallback)
Monospace:     "JetBrains Mono" (prices, Greeks, P&L figures)

Scale:
  xs     11px / 400   Tick labels, footnotes
  sm     13px / 400   Table cells, metadata
  base   15px / 400   Body text
  lg     17px / 500   Section headings
  xl     20px / 600   Page titles
  2xl    24px / 700   Dashboard KPIs
  3xl    30px / 700   Hero numbers (portfolio value)
```

## Spacing

8-point grid. All padding/margin values are multiples of 4px.

```
2   →  8px    tight inner padding
3   → 12px    standard cell padding
4   → 16px    card padding
6   → 24px    section gap
8   → 32px    panel gap
12  → 48px    page section spacing
```

## Components

### Price Cell
Displays a price with flash animation on change.
- Green flash → price moved up
- Red flash → price moved down
- Flash duration: 400ms ease-out
- Monospace font always

### Greeks Badge
Small pill with Greek letter + value. Background tint matches sign (green/red/neutral).

### Options Chain Row
```
│ [Call Bid][Call Ask][Call OI] │ Strike │ [Put Bid][Put Ask][Put OI] │
│   highlighted if ITM         │ ATM=amber│   highlighted if ITM       │
```
ATM row has amber left border accent.

### P&L Cell
- Positive: profit colour, leading "+"
- Negative: loss colour, no extra symbol (negative sign is sufficient)
- Zero: muted colour

### Alert Badge
- Info: blue outline
- Warning: amber filled
- Critical: red filled, pulsing border animation

## Icon System

Use SF Symbols (iOS/macOS) and Heroicons (web). Never mix icon sets within a screen.

| Concept | SF Symbol | Heroicon |
|---------|-----------|---------|
| Chart | chart.line.uptrend.xyaxis | ChartBarIcon |
| Options | arrow.up.arrow.down.circle | ArrowsUpDownIcon |
| Alert | exclamationmark.triangle | ExclamationTriangleIcon |
| Portfolio | briefcase | BriefcaseIcon |
| Settings | gearshape | CogIcon |
| Trade | dollarsign.circle | CurrencyDollarIcon |

## Layout Grids

### Desktop Web (≥1280px)
- 12-column grid, 24px gutters
- Chart panel: 8 cols
- Order panel: 4 cols

### Tablet Web (768–1279px)
- Chart panel full width
- Order panel below (collapsed by default)

### Mobile Web (< 768px)
- Single column
- Tab bar for main navigation

### iOS / macOS
- Native `NavigationStack` or `NavigationSplitView`
- Sidebar (macOS) / Tab bar (iOS)
