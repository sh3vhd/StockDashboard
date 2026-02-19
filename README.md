# 📈 TradeLens — Stock Dashboard

> A production-grade financial trading dashboard built with **React**, **TypeScript**, and **Recharts**. Features real-time-ready stock data visualization, interactive charts, and a fully sortable/filterable market overview table.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Symbol Search** | Search any ticker with live feedback and error handling |
| 📊 **Interactive Chart** | Area chart with 1W / 1M / 3M timeframes and custom OHLCV tooltip |
| 📋 **Market Table** | Sortable by Price, Change, Market Cap, P/E — filterable by name and sector |
| 🌙 **Dark / Light Mode** | Instant theme toggle, dark by default (trading-optimized) |
| ⏳ **Loading States** | Animated orbital spinner while data fetches |
| ⚠️ **Error Handling** | Clear error messages with one-click retry |
| 🎨 **Design System** | CSS variables, `Syne` + `JetBrains Mono` fonts, responsive layout |

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-username/stock-dashboard-react.git
cd stock-dashboard-react

# 2. Install dependencies
npm install

# 3. Add your API key (see below)
cp .env.example .env

# 4. Run dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you'll see the dashboard with mock data.

---

## 🏗️ Project Structure

```
stock-dashboard-react/
├── src/
│   ├── App.tsx                  # Root component, theme & state management
│   ├── hooks/
│   │   ├── useStockData.ts      # Data fetching hook (swap mock → real API here)
│   │   └── useTheme.ts          # Dark/light mode with localStorage
│   ├── components/
│   │   ├── Header.tsx           # Logo, search form, theme toggle
│   │   ├── HeroCard.tsx         # Big price + change display
│   │   ├── PriceChart.tsx       # Recharts area chart with timeframes
│   │   ├── StockTable.tsx       # Sortable, filterable data table
│   │   ├── CustomTooltip.tsx    # Chart hover tooltip
│   │   ├── LoadingSpinner.tsx   # Orbital loading animation
│   │   └── ErrorCard.tsx        # Error state with retry
│   ├── utils/
│   │   ├── formatters.ts        # formatPrice(), formatVolume(), getChangeColor()
│   │   └── mockData.ts          # Simulated OHLCV + stock metadata
│   └── styles/
│       └── tokens.css           # Design tokens (CSS variables)
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔌 Connecting a Real API

The mock data layer is isolated in `src/hooks/useStockData.ts`. To connect a real API, replace the mock fetch with one of these:

### Option A — Finnhub (Free tier: 60 req/min)

```typescript
// src/hooks/useStockData.ts

const API_KEY = import.meta.env.VITE_FINNHUB_KEY;

// Current quote
const quoteRes = await fetch(
  `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
);
const quote = await quoteRes.json();
// quote.c = current price, quote.d = change, quote.dp = change %

// Candle history (requires premium for intraday)
const candleRes = await fetch(
  `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${unixFrom}&to=${unixTo}&token=${API_KEY}`
);
```

### Option B — Alpha Vantage (Free tier: 5 req/min)

```typescript
const API_KEY = import.meta.env.VITE_AV_KEY;

const res = await fetch(
  `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${API_KEY}`
);
const data = await res.json();
const series = data["Time Series (Daily)"];
// Each key: { "1. open", "2. high", "3. low", "4. close", "6. volume" }
```

### .env.example

```env
VITE_FINNHUB_KEY=your_finnhub_api_key
VITE_AV_KEY=your_alpha_vantage_key
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework with hooks architecture |
| **TypeScript** | Type safety across all components and data shapes |
| **Recharts** | Declarative, composable charts built on SVG |
| **Vite** | Lightning-fast build tool and dev server |
| **CSS Variables** | Consistent design tokens for theming |
| **Google Fonts** | `Syne` (display) + `JetBrains Mono` (data) |

### Optional Backend (Node.js)

If you need to hide API keys server-side or aggregate data:

```bash
# Simple Express proxy
npm install express node-fetch cors dotenv

# server.js
app.get('/api/quote/:symbol', async (req, res) => {
  const data = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${req.params.symbol}&token=${process.env.FINNHUB_KEY}`
  );
  res.json(await data.json());
});
```

---

## 🧠 Architecture Decisions

### Why `useStockData` as a custom hook?
Encapsulating all fetch logic (loading, error, retry, symbol dependency) in a custom hook keeps components focused purely on rendering. Swapping the data source requires changing only one file.

### Why Recharts over Chart.js?
Recharts is React-native — every chart element is a React component, making conditional rendering, custom tooltips, and responsive sizing trivial without manual canvas manipulation.

### Why CSS Variables over Tailwind?
For a dashboard with many dynamic, data-driven colors (positive/negative, accent glow, gradients), CSS variables allow runtime theme switching with zero JavaScript overhead — just toggle a class on the root element.

### Why `useMemo` on table data?
Sorting and filtering 10-50 stocks is fast, but with `useMemo` we guarantee zero recalculation when unrelated state (e.g., the search input value) changes. Good habit for tables that may grow.

---

## 📐 Design Philosophy

**TradeLens** uses an **industrial / precision** aesthetic:
- **Dark-first** — trading apps are used for hours; dark mode reduces eye strain
- **Monospace data** — numbers in `JetBrains Mono` align perfectly in tables and charts
- **Color with meaning** — green (`#00d4aa`) = positive, red (`#ff4d6d`) = negative, consistently everywhere
- **Subtle depth** — grid texture background, glow effects on cards, not just flat rectangles
- **Micro-interactions** — animated live dot, fade-in on data load, smooth hover states

---

## 📦 Available Scripts

```bash
npm run dev       # Start development server (http://localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
npm run type-check # TypeScript check without emitting
```

---

## 🗺️ Roadmap

- [ ] WebSocket real-time price updates (Finnhub supports this free)
- [ ] Portfolio tracker with buy/sell entries
- [ ] News feed sidebar (Finnhub `/company-news`)
- [ ] Candlestick chart mode (OHLC bars)
- [ ] Watchlist with localStorage persistence
- [ ] Mobile-optimized swipeable chart

---

## 📄 License

MIT — free to use for personal and commercial projects.

---

<div align="center">

Built with ♥ using React + Recharts + Syne

</div>
