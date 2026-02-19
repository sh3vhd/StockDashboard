/**
 * ============================================================
 *  STOCK DASHBOARD — Production-Grade Trading Interface
 *  Built with React + Recharts + Finnhub REST API (simulated)
 * ============================================================
 *
 *  ARCHITECTURE OVERVIEW:
 *  ┌─────────────────────────────────────────────────────┐
 *  │  App (root state, theme management)                 │
 *  │  ├── Header (search + theme toggle)                 │
 *  │  ├── HeroCard (current price + sparkline)           │
 *  │  ├── MetricsBar (volume, market cap, P/E etc.)      │
 *  │  ├── PriceChart (interactive Recharts area chart)   │
 *  │  └── StockTable (sortable + filterable data table)  │
 *  └─────────────────────────────────────────────────────┘
 *
 *  DATA FLOW:
 *  searchSymbol → fetchStockData() → state update → re-render
 *
 *  NOTE: In production, replace MOCK_DATA with real API calls:
 *  - Finnhub: https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY
 *  - Alpha Vantage: https://www.alphavantage.co/query?function=TIME_SERIES_DAILY
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ============================================================
//  MOCK DATA LAYER
//  Replace these functions with real API calls in production
// ============================================================

/**
 * Generates realistic-looking OHLCV price history for a symbol.
 * Uses a random walk algorithm (Geometric Brownian Motion simplified).
 * @param {string} symbol - Ticker symbol (e.g., "AAPL")
 * @param {number} basePrice - Starting price for the simulation
 * @param {number} days - Number of trading days to generate
 */
const generatePriceHistory = (symbol, basePrice, days = 90) => {
  const history = [];
  let price = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends — stock markets are closed
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Random daily return between -3% and +3%
    const dailyReturn = (Math.random() - 0.48) * 0.06;
    price = price * (1 + dailyReturn);

    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 80000000 + 20000000);

    history.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: parseFloat(price.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume,
    });
  }
  return history;
};

/**
 * MOCK_STOCKS — Simulated market data for popular tickers.
 * In production, this would come from Finnhub /quote endpoint.
 */
const MOCK_STOCKS = {
  AAPL: { name: "Apple Inc.", price: 189.3, change: 1.24, changePercent: 0.66, marketCap: "2.94T", pe: 29.4, volume: "58.2M", sector: "Technology" },
  MSFT: { name: "Microsoft Corp.", price: 415.2, change: -2.1, changePercent: -0.5, marketCap: "3.08T", pe: 34.7, volume: "22.1M", sector: "Technology" },
  GOOGL: { name: "Alphabet Inc.", price: 172.8, change: 3.45, changePercent: 2.04, marketCap: "2.17T", pe: 24.1, volume: "19.8M", sector: "Technology" },
  AMZN: { name: "Amazon.com Inc.", price: 201.4, change: -0.8, changePercent: -0.4, marketCap: "2.13T", pe: 44.2, volume: "31.5M", sector: "Consumer" },
  TSLA: { name: "Tesla Inc.", price: 248.5, change: 8.2, changePercent: 3.41, marketCap: "792B", pe: 73.1, volume: "112.4M", sector: "Automotive" },
  META: { name: "Meta Platforms", price: 524.7, change: 6.3, changePercent: 1.22, marketCap: "1.34T", pe: 26.8, volume: "14.9M", sector: "Technology" },
  NVDA: { name: "NVIDIA Corp.", price: 875.4, change: 22.1, changePercent: 2.59, marketCap: "2.16T", pe: 67.3, volume: "44.7M", sector: "Semiconductors" },
  JPM:  { name: "JPMorgan Chase", price: 213.6, change: -1.2, changePercent: -0.56, marketCap: "613B", pe: 11.4, volume: "8.3M", sector: "Finance" },
  BRK:  { name: "Berkshire Hathaway", price: 424.1, change: 0.9, changePercent: 0.21, marketCap: "927B", pe: 21.2, volume: "3.1M", sector: "Finance" },
  V:    { name: "Visa Inc.", price: 276.3, change: 1.8, changePercent: 0.66, marketCap: "554B", pe: 30.1, volume: "6.7M", sector: "Finance" },
};

// ============================================================
//  CUSTOM HOOKS
// ============================================================

/**
 * useStockData — Manages all data fetching logic.
 * Encapsulates loading, error, and data states.
 * Replace the mock fetch inside with a real API call.
 */
const useStockData = (symbol) => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (sym) => {
    if (!sym) return;
    setLoading(true);
    setError(null);

    try {
      // Simulate network latency (300-800ms)
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

      const upperSym = sym.toUpperCase();
      const stockInfo = MOCK_STOCKS[upperSym];

      if (!stockInfo) {
        throw new Error(`Symbol "${upperSym}" not found. Try: AAPL, MSFT, GOOGL, TSLA, NVDA`);
      }

      // Generate price history based on current price (working backwards)
      const priceHistory = generatePriceHistory(upperSym, stockInfo.price * 0.85, 90);

      setData({ symbol: upperSym, ...stockInfo });
      setHistory(priceHistory);
    } catch (err) {
      setError(err.message);
      setData(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when symbol changes
  useEffect(() => {
    fetchData(symbol);
  }, [symbol, fetchData]);

  return { data, history, loading, error, refetch: fetchData };
};

/**
 * useTheme — Manages dark/light mode with localStorage persistence.
 */
const useTheme = () => {
  const [isDark, setIsDark] = useState(true); // Default: dark mode for trading apps

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
};

// ============================================================
//  UTILITY FUNCTIONS
// ============================================================

/** Formats a number as USD currency (e.g., 189.3 → "$189.30") */
const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

/** Formats large numbers with commas (e.g., 58200000 → "58,200,000") */
const formatVolume = (vol) =>
  new Intl.NumberFormat("en-US").format(vol);

/** Returns CSS color class based on positive/negative value */
const getChangeColor = (value) => (value >= 0 ? "positive" : "negative");

// ============================================================
//  SUB-COMPONENTS
// ============================================================

/**
 * LoadingSpinner — Animated orbital loading indicator.
 * Shown while API request is in flight.
 */
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner">
      <div className="orbit" />
      <div className="core" />
    </div>
    <p className="loading-text">Fetching market data...</p>
  </div>
);

/**
 * ErrorCard — Displays API/validation errors with a retry option.
 * @param {string} message - Error description
 * @param {function} onRetry - Callback to re-trigger the fetch
 */
const ErrorCard = ({ message, onRetry }) => (
  <div className="error-card">
    <span className="error-icon">⚠</span>
    <p className="error-message">{message}</p>
    <button className="retry-btn" onClick={onRetry}>
      Try Again
    </button>
  </div>
);

/**
 * CustomTooltip — Replaces Recharts' default tooltip with a styled version.
 * Renders inside the chart at the hovered data point position.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload; // Full data point from the chart

  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{label}</p>
      <p className="tooltip-price">{formatPrice(d.price)}</p>
      <div className="tooltip-grid">
        <span>O: {formatPrice(d.open)}</span>
        <span>H: {formatPrice(d.high)}</span>
        <span>L: {formatPrice(d.low)}</span>
        <span>V: {formatVolume(d.volume)}</span>
      </div>
    </div>
  );
};

/**
 * PriceChart — The main interactive area chart.
 * Uses Recharts ResponsiveContainer for fluid sizing.
 * @param {Array} history - Array of OHLCV price objects
 * @param {boolean} isPositive - Whether overall trend is up (affects gradient color)
 */
const PriceChart = ({ history, isPositive }) => {
  const [timeframe, setTimeframe] = useState("3M"); // Active timeframe filter

  // Slice data based on selected timeframe
  const filteredData = useMemo(() => {
    const frames = { "1W": 5, "1M": 22, "3M": 66 };
    const count = frames[timeframe] || history.length;
    return history.slice(-count);
  }, [history, timeframe]);

  // Calculate the starting price for the reference line
  const startPrice = filteredData[0]?.price;

  // Gradient color: green for uptrend, red for downtrend
  const gradientColor = isPositive ? "#00d4aa" : "#ff4d6d";

  return (
    <div className="chart-card">
      {/* Timeframe selector buttons */}
      <div className="chart-header">
        <h3 className="chart-title">Price History</h3>
        <div className="timeframe-buttons">
          {["1W", "1M", "3M"].map((tf) => (
            <button
              key={tf}
              className={`tf-btn ${timeframe === tf ? "active" : ""}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts area chart with custom gradient fill */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {/* SVG gradient definition — fills area under the price line */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Subtle background grid lines */}
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

          {/* X-axis: shows date labels, hidden ticks */}
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(filteredData.length / 6)}
          />

          {/* Y-axis: auto-scaled to data range */}
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            domain={["auto", "auto"]}
            width={55}
          />

          {/* Hover tooltip using our custom component */}
          <Tooltip content={<CustomTooltip />} />

          {/* Reference line shows starting price for context */}
          {startPrice && (
            <ReferenceLine
              y={startPrice}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 4"
            />
          )}

          {/* Main price area — gradient fill + solid stroke */}
          <Area
            type="monotone"
            dataKey="price"
            stroke={gradientColor}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 5, fill: gradientColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * StockTable — Sortable and filterable data table.
 * Shows all available stocks with key financial metrics.
 * @param {string} activeSymbol - Currently selected symbol (highlighted row)
 * @param {function} onSelect - Callback when user clicks a row
 */
const StockTable = ({ activeSymbol, onSelect }) => {
  const [sortKey, setSortKey] = useState("marketCap"); // Column to sort by
  const [sortDir, setSortDir] = useState("desc");       // "asc" or "desc"
  const [filter, setFilter] = useState("");             // Text search filter
  const [sectorFilter, setSectorFilter] = useState("All"); // Sector dropdown

  // Unique sector list for dropdown
  const sectors = ["All", ...new Set(Object.values(MOCK_STOCKS).map((s) => s.sector))];

  /**
   * handleSort — Toggles sort direction if same column clicked,
   * otherwise switches to new column with descending order.
   */
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  /**
   * processedStocks — Applies filtering and sorting to MOCK_STOCKS.
   * Uses useMemo to avoid recalculation on every render.
   */
  const processedStocks = useMemo(() => {
    let stocks = Object.entries(MOCK_STOCKS).map(([sym, data]) => ({
      symbol: sym,
      ...data,
    }));

    // Text filter: matches symbol or company name
    if (filter) {
      const q = filter.toLowerCase();
      stocks = stocks.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    // Sector filter dropdown
    if (sectorFilter !== "All") {
      stocks = stocks.filter((s) => s.sector === sectorFilter);
    }

    // Sort: parse numeric values from strings like "2.94T" or "58.2M"
    const parseNumeric = (val) => {
      if (typeof val === "number") return val;
      const v = parseFloat(val);
      if (val.endsWith("T")) return v * 1e12;
      if (val.endsWith("B")) return v * 1e9;
      if (val.endsWith("M")) return v * 1e6;
      return v;
    };

    stocks.sort((a, b) => {
      const av = parseNumeric(a[sortKey]);
      const bv = parseNumeric(b[sortKey]);
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return stocks;
  }, [filter, sectorFilter, sortKey, sortDir]);

  /** SortIcon — Renders ▲/▼ based on current sort state */
  const SortIcon = ({ col }) => (
    <span className="sort-icon">
      {sortKey === col ? (sortDir === "asc" ? " ▲" : " ▼") : " ↕"}
    </span>
  );

  return (
    <div className="table-card">
      {/* Table controls: search input + sector filter */}
      <div className="table-controls">
        <h3 className="chart-title">Market Overview</h3>
        <div className="table-filters">
          <input
            className="filter-input"
            placeholder="Search symbol or name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className="filter-select"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
          >
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th className="sortable" onClick={() => handleSort("price")}>
                Price <SortIcon col="price" />
              </th>
              <th className="sortable" onClick={() => handleSort("changePercent")}>
                Change <SortIcon col="changePercent" />
              </th>
              <th className="sortable" onClick={() => handleSort("marketCap")}>
                Mkt Cap <SortIcon col="marketCap" />
              </th>
              <th className="sortable" onClick={() => handleSort("pe")}>
                P/E <SortIcon col="pe" />
              </th>
              <th>Volume</th>
              <th>Sector</th>
            </tr>
          </thead>
          <tbody>
            {processedStocks.map((stock) => (
              <tr
                key={stock.symbol}
                className={`table-row ${activeSymbol === stock.symbol ? "active" : ""}`}
                onClick={() => onSelect(stock.symbol)}
              >
                <td className="symbol-cell">{stock.symbol}</td>
                <td className="name-cell">{stock.name}</td>
                <td className="mono">{formatPrice(stock.price)}</td>
                <td className={`mono ${getChangeColor(stock.changePercent)}`}>
                  {stock.changePercent >= 0 ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </td>
                <td className="mono">{stock.marketCap}</td>
                <td className="mono">{stock.pe}</td>
                <td className="mono">{stock.volume}</td>
                <td>
                  <span className="sector-badge">{stock.sector}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state when filters produce no results */}
        {processedStocks.length === 0 && (
          <div className="empty-state">No stocks match your filters.</div>
        )}
      </div>
    </div>
  );
};

// ============================================================
//  MAIN APP COMPONENT
// ============================================================

export default function App() {
  const { isDark, toggle: toggleTheme } = useTheme();

  // The currently displayed stock symbol
  const [activeSymbol, setActiveSymbol] = useState("AAPL");

  // Search input value (separate from activeSymbol to allow typing without fetching)
  const [searchInput, setSearchInput] = useState("AAPL");

  // Fetch data whenever activeSymbol changes
  const { data, history, loading, error, refetch } = useStockData(activeSymbol);

  /**
   * handleSearch — Triggered on form submit or Enter key.
   * Sets the active symbol which triggers the data hook.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSymbol(searchInput.trim().toUpperCase());
    }
  };

  /** handleTableSelect — Updates symbol from table row click */
  const handleTableSelect = (symbol) => {
    setActiveSymbol(symbol);
    setSearchInput(symbol);
  };

  // Determine if today's change is positive for color theming
  const isPositive = data ? data.changePercent >= 0 : true;

  return (
    <div className={`app ${isDark ? "dark" : "light"}`}>
      {/* ===== GLOBAL STYLES ===== */}
      <style>{`
        /* ── Google Fonts import ── */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* ── CSS Custom Properties (Design Tokens) ── */
        .dark {
          --bg-primary: #080c14;
          --bg-secondary: #0d1421;
          --bg-card: #111827;
          --bg-card-hover: #161f2e;
          --border: rgba(255,255,255,0.07);
          --text-primary: #f0f4ff;
          --text-secondary: #6b7280;
          --text-muted: #374151;
          --accent: #00d4aa;
          --accent-glow: rgba(0,212,170,0.2);
          --positive: #00d4aa;
          --negative: #ff4d6d;
          --surface: rgba(255,255,255,0.03);
        }
        .light {
          --bg-primary: #f0f4ff;
          --bg-secondary: #e8edf8;
          --bg-card: #ffffff;
          --bg-card-hover: #f8faff;
          --border: rgba(0,0,0,0.08);
          --text-primary: #0d1421;
          --text-secondary: #6b7280;
          --text-muted: #9ca3af;
          --accent: #0066ff;
          --accent-glow: rgba(0,102,255,0.15);
          --positive: #00a878;
          --negative: #e03050;
          --surface: rgba(0,0,0,0.03);
        }

        /* ── Reset & Base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Syne', sans-serif; background: var(--bg-primary); color: var(--text-primary); }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* ── App Layout ── */
        .app {
          min-height: 100vh;
          background: var(--bg-primary);
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* Subtle grid background texture */
        .app::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }
        .light .app::before {
          background-image:
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
          margin-bottom: 32px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        .logo-dot {
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 12px var(--accent-glow);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        /* ── Search Form ── */
        .search-form { display: flex; gap: 8px; }
        .search-input {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 10px 16px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          width: 160px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .search-btn {
          background: var(--accent);
          color: var(--bg-primary);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .search-btn:hover { opacity: 0.85; }
        .search-btn:active { transform: scale(0.97); }

        /* ── Theme Toggle ── */
        .theme-toggle {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .theme-toggle:hover { background: var(--bg-card-hover); color: var(--text-primary); }

        /* ── Hero Section ── */
        .hero-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) {
          .hero-section { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .hero-section { grid-template-columns: 1fr; }
        }

        /* ── Cards ── */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: background 0.2s;
        }
        .card:hover { background: var(--bg-card-hover); }

        .hero-card {
          grid-column: span 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        /* Accent glow effect on hero card */
        .hero-card::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 200px;
          height: 200px;
          background: var(--accent-glow);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .hero-symbol {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 4px;
          font-family: 'JetBrains Mono', monospace;
        }
        .hero-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .hero-price {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -2px;
          color: var(--text-primary);
          line-height: 1;
          margin: 12px 0;
          font-family: 'JetBrains Mono', monospace;
        }
        .hero-change {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .positive { color: var(--positive); }
        .negative { color: var(--negative); }
        .positive-bg { background: rgba(0,212,170,0.1); color: var(--positive); }
        .negative-bg { background: rgba(255,77,109,0.1); color: var(--negative); }

        /* ── Metric Cards ── */
        .metric-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .metric-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
        }
        .metric-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Chart Card ── */
        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .chart-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .timeframe-buttons { display: flex; gap: 6px; }
        .tf-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tf-btn:hover { color: var(--text-primary); background: var(--bg-card-hover); }
        .tf-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--bg-primary);
        }

        /* ── Custom Tooltip ── */
        .chart-tooltip {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 16px;
          font-family: 'JetBrains Mono', monospace;
        }
        .tooltip-date { font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; }
        .tooltip-price { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .tooltip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 11px; color: var(--text-secondary); }

        /* ── Table Card ── */
        .table-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 40px;
        }
        .table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .table-filters { display: flex; gap: 10px; }
        .filter-input, .filter-select {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .filter-input:focus, .filter-select:focus { border-color: var(--accent); }
        .filter-input { width: 220px; }
        .filter-select { cursor: pointer; }

        .table-wrapper { overflow-x: auto; }
        .stock-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .stock-table thead tr {
          border-bottom: 1px solid var(--border);
        }
        .stock-table th {
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .stock-table th.sortable { cursor: pointer; user-select: none; }
        .stock-table th.sortable:hover { color: var(--text-primary); }
        .sort-icon { font-size: 10px; opacity: 0.6; }

        .table-row {
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .table-row:hover { background: var(--surface); }
        .table-row.active {
          background: var(--accent-glow);
          border-left: 3px solid var(--accent);
        }
        .stock-table td { padding: 14px 14px; vertical-align: middle; }

        .symbol-cell {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          color: var(--accent);
          letter-spacing: 1px;
        }
        .name-cell {
          color: var(--text-secondary);
          font-size: 13px;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sector-badge {
          display: inline-block;
          padding: 3px 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        /* ── Loading Spinner ── */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 20px;
        }
        .spinner {
          position: relative;
          width: 60px;
          height: 60px;
        }
        .orbit {
          position: absolute;
          inset: 0;
          border: 2px solid transparent;
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 15px var(--accent);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text {
          font-size: 13px;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 1px;
        }

        /* ── Error Card ── */
        .error-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 40px;
          background: rgba(255,77,109,0.05);
          border: 1px solid rgba(255,77,109,0.2);
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .error-icon { font-size: 32px; }
        .error-message { color: var(--text-secondary); text-align: center; font-size: 14px; }
        .retry-btn {
          background: var(--negative);
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .retry-btn:hover { opacity: 0.85; }

        /* ── Live Badge ── */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
          padding: 5px 10px;
          border: 1px solid var(--accent-glow);
          border-radius: 20px;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        /* ── Fade-in Animation for content ── */
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="container">
        <header className="header">
          {/* Logo with animated live indicator */}
          <div className="logo">
            <div className="logo-dot" />
            TRADE<span style={{ color: "var(--accent)" }}>LENS</span>
          </div>

          {/* Live market badge */}
          <div className="live-badge">
            <div className="live-dot" />
            LIVE MARKET
          </div>

          {/* Symbol search form */}
          <form className="search-form" onSubmit={handleSearch}>
            <input
              className="search-input mono"
              placeholder="SYMBOL"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={5}
            />
            <button className="search-btn" type="submit">
              SEARCH
            </button>
          </form>

          {/* Dark/Light theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDark ? "☀" : "◑"}
          </button>
        </header>

        {/* ===== LOADING STATE ===== */}
        {loading && <LoadingSpinner />}

        {/* ===== ERROR STATE ===== */}
        {!loading && error && (
          <ErrorCard message={error} onRetry={() => refetch(activeSymbol)} />
        )}

        {/* ===== MAIN CONTENT (shown when data is available) ===== */}
        {!loading && data && (
          <div className="fade-in">

            {/* ── Hero Cards Row ── */}
            <div className="hero-section">

              {/* Main price hero card */}
              <div className="card hero-card">
                <div className="hero-top">
                  <div>
                    <div className="hero-symbol">{data.symbol}</div>
                    <div className="hero-name">{data.name}</div>
                  </div>
                  {/* Sector tag */}
                  <span className="sector-badge">{data.sector}</span>
                </div>
                <div>
                  {/* Large price display */}
                  <div className="hero-price mono">{formatPrice(data.price)}</div>
                  {/* Price change chip — color-coded by direction */}
                  <span className={`hero-change ${isPositive ? "positive-bg" : "negative-bg"}`}>
                    {isPositive ? "▲" : "▼"}
                    {formatPrice(Math.abs(data.change))} ({isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Key Metrics side card */}
              <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
                <div>
                  <div className="metric-label">Market Cap</div>
                  <div className="metric-value">{data.marketCap}</div>
                </div>
                <div>
                  <div className="metric-label">P/E Ratio</div>
                  <div className="metric-value">{data.pe}</div>
                  <div className="metric-sub">Price-to-Earnings</div>
                </div>
                <div>
                  <div className="metric-label">Volume (24h)</div>
                  <div className="metric-value">{data.volume}</div>
                  <div className="metric-sub">Shares traded</div>
                </div>
              </div>
            </div>

            {/* ── Interactive Price Chart ── */}
            <PriceChart history={history} isPositive={isPositive} />

          </div>
        )}

        {/* ── Stock Table (always visible) ── */}
        <StockTable activeSymbol={activeSymbol} onSelect={handleTableSelect} />
      </div>
    </div>
  );
}
