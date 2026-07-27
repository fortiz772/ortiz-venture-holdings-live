(function () {
  "use strict";

  /* ================= Utilities ================= */

  function makeRng(seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let state = h >>> 0;
    return function rng() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fmtPrice(n) {
    return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fmtPct(n) {
    return (n > 0 ? "+" : "") + n.toFixed(2) + "%";
  }

  function fmtSignedMoney(n) {
    return (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ================= Data ================= */

  const SECTOR_META = {
    Technology: { color: "cyan", icon: "cpu" },
    Consumer: { color: "orange", icon: "shopping-bag" },
    Communication: { color: "pink", icon: "tv" },
    Financials: { color: "green", icon: "landmark" },
    Healthcare: { color: "purple", icon: "activity" },
    Energy: { color: "yellow", icon: "zap" },
    Index: { color: "blue", icon: "globe" },
  };

  const NEON_HEX = { cyan: "#00b8f4", green: "#14c977", pink: "#ef3ec2", purple: "#8f52ff", orange: "#ff9b30", yellow: "#c79400", blue: "#3d7dff" };
  const PORTFOLIO_PALETTE = [NEON_HEX.cyan, NEON_HEX.orange, NEON_HEX.purple, NEON_HEX.green, NEON_HEX.pink];

  function defStock(symbol, name, sector, base, vol) {
    return { symbol, name, sector, base, vol };
  }

  const UNIVERSE = [
    defStock("AAPL", "Apple Inc.", "Technology", 213.20, 0.34),
    defStock("MSFT", "Microsoft Corp.", "Technology", 425.10, 0.30),
    defStock("GOOGL", "Alphabet Inc.", "Technology", 175.40, 0.38),
    defStock("NVDA", "NVIDIA Corp.", "Technology", 135.60, 0.62),
    defStock("ADBE", "Adobe Inc.", "Technology", 510.30, 0.40),
    defStock("CRM", "Salesforce Inc.", "Technology", 300.20, 0.42),
    defStock("ORCL", "Oracle Corp.", "Technology", 168.50, 0.36),
    defStock("INTC", "Intel Corp.", "Technology", 32.10, 0.55),

    defStock("AMZN", "Amazon.com Inc.", "Consumer", 195.80, 0.40),
    defStock("TSLA", "Tesla Inc.", "Consumer", 245.30, 0.80),
    defStock("NKE", "Nike Inc.", "Consumer", 78.40, 0.38),
    defStock("SBUX", "Starbucks Corp.", "Consumer", 95.20, 0.32),
    defStock("COST", "Costco Wholesale", "Consumer", 890.50, 0.22),
    defStock("WMT", "Walmart Inc.", "Consumer", 92.10, 0.20),

    defStock("META", "Meta Platforms", "Communication", 560.40, 0.46),
    defStock("NFLX", "Netflix Inc.", "Communication", 720.60, 0.44),
    defStock("DIS", "Walt Disney Co.", "Communication", 112.30, 0.34),

    defStock("JPM", "JPMorgan Chase", "Financials", 215.70, 0.26),
    defStock("GS", "Goldman Sachs", "Financials", 480.90, 0.30),
    defStock("V", "Visa Inc.", "Financials", 275.10, 0.22),
    defStock("PYPL", "PayPal Holdings", "Financials", 78.60, 0.42),
    defStock("BAC", "Bank of America", "Financials", 40.20, 0.28),

    defStock("PFE", "Pfizer Inc.", "Healthcare", 27.40, 0.24),
    defStock("JNJ", "Johnson & Johnson", "Healthcare", 152.80, 0.16),
    defStock("UNH", "UnitedHealth Group", "Healthcare", 520.30, 0.30),

    defStock("XOM", "Exxon Mobil", "Energy", 118.20, 0.28),
    defStock("CVX", "Chevron Corp.", "Energy", 158.40, 0.26),

    defStock("SPY", "S&P 500 ETF Trust", "Index", 560.10, 0.14),
    defStock("QQQ", "Invesco QQQ Trust", "Index", 480.50, 0.18),
    defStock("DIA", "SPDR Dow Jones ETF", "Index", 410.30, 0.13),
  ];

  const SAMPLE_PORTFOLIO = [
    { symbol: "AAPL", shares: 12, cost: 168.40 },
    { symbol: "NVDA", shares: 6, cost: 410.75 },
    { symbol: "MSFT", shares: 8, cost: 331.20 },
    { symbol: "TSLA", shares: 5, cost: 191.10 },
    { symbol: "AMZN", shares: 10, cost: 145.60 },
  ];

  const BULLISH_NEWS = [
    "{sym} extends gains as momentum builds",
    "{sym} climbs on broad buying interest",
    "Traders eye {sym} after a strong technical breakout",
    "{sym} holds above its short-term average, signaling strength",
    "{sym} outpaces the tape in a broad risk-on session",
  ];
  const BEARISH_NEWS = [
    "{sym} slips as sellers take control",
    "{sym} pulls back after its recent run-up",
    "{sym} breaks below short-term support",
    "Momentum fades for {sym} in choppy trading",
    "{sym} underperforms as profit-taking sets in",
  ];
  const NEUTRAL_NEWS = [
    "{sym} trades in a tight range as investors await catalysts",
    "{sym} holds steady near its short-term average",
    "Volume thins out for {sym} amid a quiet session",
    "{sym} consolidates after a volatile stretch",
  ];

  /* ================= Config ================= */

  const HISTORY_SEED_LEN = 50;
  const HISTORY_MAX_LEN = 140;
  const TICK_MS = 2200;
  const SPOTLIGHT_MS = 6500;
  const NEWS_MS = 16000;
  const WATCHLIST_KEY = "pulsewise.watchlist.v1";
  const ALERTS_KEY = "pulsewise.alerts.v1";
  const DEFAULT_WATCHLIST = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META"];

  /* ================= State ================= */

  const stocks = new Map();
  const cardRefs = new Map();
  const tickerRefs = new Map();
  const el = {};

  let watchlist = [];
  let alerts = [];
  let spotlightIndex = 0;
  let activeModalSymbol = null;
  let modalRefs = null;
  let lastFocusedEl = null;

  /* ================= Price engine ================= */

  function initStocks() {
    UNIVERSE.forEach((meta) => {
      const rng = makeRng(meta.symbol);
      let price = meta.base;
      const history = [];
      for (let i = 0; i < HISTORY_SEED_LEN; i++) {
        const step = (rng() - 0.5) * 2 * (meta.vol / 100) * meta.base;
        const reversion = (meta.base - price) * 0.02;
        price = Math.max(0.5, price + step + reversion);
        history.push(price);
      }
      stocks.set(meta.symbol, { meta, history, rng });
    });
  }

  function tickStocks() {
    stocks.forEach((st) => {
      const { meta, history, rng } = st;
      const price = history[history.length - 1];
      const step = (rng() - 0.5) * 2 * (meta.vol / 100) * meta.base;
      const reversion = (meta.base - price) * 0.015;
      const next = Math.max(0.5, price + step + reversion);
      history.push(next);
      if (history.length > HISTORY_MAX_LEN) history.shift();
    });
  }

  function pctChangeToday(symbol) {
    const h = stocks.get(symbol).history;
    return ((h[h.length - 1] - h[0]) / h[0]) * 100;
  }

  /* ================= Indicators (real math on the simulated feed) ================= */

  function sma(history, period) {
    const slice = history.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  function rsi(history, period) {
    period = period || 14;
    const slice = history.slice(-(period + 1));
    if (slice.length < 3) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i < slice.length; i++) {
      const d = slice[i] - slice[i - 1];
      if (d >= 0) gains += d; else losses -= d;
    }
    const avgGain = gains / period, avgLoss = losses / period;
    if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
  }

  function momentum(history, period) {
    period = period || 10;
    const n = history.length;
    const ref = history[Math.max(0, n - 1 - period)];
    if (!ref) return 0;
    return ((history[n - 1] - ref) / ref) * 100;
  }

  function volatilityInfo(history) {
    const rets = [];
    for (let i = 1; i < history.length; i++) rets.push((history[i] - history[i - 1]) / history[i - 1]);
    if (!rets.length) return { label: "Low", value: 0 };
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / rets.length;
    const stdevPct = Math.sqrt(variance) * 100;
    if (stdevPct < 0.18) return { label: "Low", value: stdevPct };
    if (stdevPct < 0.42) return { label: "Moderate", value: stdevPct };
    return { label: "High", value: stdevPct };
  }

  function computeSignal(symbol) {
    const h = stocks.get(symbol).history;
    const price = h[h.length - 1];
    const s10 = sma(h, Math.min(10, h.length));
    const s30 = sma(h, Math.min(30, h.length));
    const r = rsi(h, 14);
    const mom = momentum(h, 10);
    const vol = volatilityInfo(h);

    let bull = 0, bear = 0;
    if (price > s10) bull++; else bear++;
    if (s10 > s30) bull++; else bear++;
    if (r > 55) bull++; else if (r < 45) bear++;
    if (mom > 0.15) bull++; else if (mom < -0.15) bear++;

    let signal, confidence;
    const total = bull + bear || 1;
    if (bull > bear) { signal = "Bullish"; confidence = 54 + Math.round((bull / total) * 40); }
    else if (bear > bull) { signal = "Bearish"; confidence = 54 + Math.round((bear / total) * 40); }
    else { signal = "Neutral"; confidence = 50; }

    return { price, sma10: s10, sma30: s30, rsi: r, momentum: mom, volatility: vol, signal, confidence: clamp(confidence, 50, 96) };
  }

  function signalWord(signal) {
    if (signal === "Bullish") return "bullish";
    if (signal === "Bearish") return "bearish";
    return "neutral / consolidating";
  }

  function insightSentence(symbol, m) {
    const rel = m.price >= m.sma10 ? "above" : "below";
    const gap = Math.abs(((m.price - m.sma10) / m.sma10) * 100).toFixed(1);
    const momDir = m.momentum >= 0 ? "risen" : "fallen";
    const rsiLabel = m.rsi > 65 ? "overbought" : m.rsi < 35 ? "oversold" : "neutral";
    return symbol + " is trading " + gap + "% " + rel + " its 10-tick average with RSI at " + m.rsi.toFixed(0) + " (" + rsiLabel + "). Momentum has " + momDir + " " + Math.abs(m.momentum).toFixed(1) + "% over the last 10 ticks with " + m.volatility.label.toLowerCase() + " volatility — the model reads this as " + signalWord(m.signal) + " (" + m.confidence + "% confidence).";
  }

  /* ================= Persistence ================= */

  function loadWatchlist() {
    try {
      const raw = window.localStorage.getItem(WATCHLIST_KEY);
      if (!raw) return DEFAULT_WATCHLIST.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : DEFAULT_WATCHLIST.slice();
    } catch (e) {
      return DEFAULT_WATCHLIST.slice();
    }
  }

  function saveWatchlist() {
    try { window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist)); } catch (e) { /* storage unavailable */ }
  }

  function loadAlerts() {
    try {
      const raw = window.localStorage.getItem(ALERTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveAlerts() {
    try { window.localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); } catch (e) { /* storage unavailable */ }
  }

  /* ================= Chart helpers ================= */

  function buildLinePath(values, width, height, pad) {
    pad = pad == null ? 2 : pad;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const range = (max - min) || 1;
    const stepX = (width - pad * 2) / Math.max(1, values.length - 1);
    const points = values.map((v, i) => [pad + i * stepX, pad + (height - pad * 2) * (1 - (v - min) / range)]);
    let d = "M " + points[0][0].toFixed(2) + " " + points[0][1].toFixed(2);
    for (let i = 1; i < points.length; i++) {
      const x0 = points[i - 1][0], y0 = points[i - 1][1], x1 = points[i][0], y1 = points[i][1];
      d += " Q " + x0.toFixed(2) + " " + y0.toFixed(2) + " " + ((x0 + x1) / 2).toFixed(2) + " " + ((y0 + y1) / 2).toFixed(2);
    }
    const last = points[points.length - 1];
    d += " L " + last[0].toFixed(2) + " " + last[1].toFixed(2);
    return { d, min, max };
  }

  function buildAreaPath(lineD, width, height, pad) {
    pad = pad == null ? 2 : pad;
    return lineD + " L " + (width - pad).toFixed(2) + " " + (height - pad).toFixed(2) + " L " + pad.toFixed(2) + " " + (height - pad).toFixed(2) + " Z";
  }

  function sparkSvg(history, trendUp, w, h) {
    const line = buildLinePath(history.slice(-30), w, h, 3);
    const area = buildAreaPath(line.d, w, h, 3);
    const cls = trendUp ? "up" : "down";
    return '<svg class="sparkline" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none">' +
      '<path class="spark-area ' + cls + '" d="' + area + '"></path>' +
      '<path class="spark-line ' + cls + '" d="' + line.d + '"></path></svg>';
  }

  function statBox(label, value) {
    return '<div class="stat-box"><div class="sb-label">' + label + '</div><div class="sb-value">' + value + '</div></div>';
  }

  /* ================= DOM cache ================= */

  function cacheDom() {
    el.tickerTrack = document.getElementById("ticker-track");
    el.statRow = document.getElementById("stat-row");
    el.watchlistGrid = document.getElementById("watchlist-grid");
    el.moversList = document.getElementById("movers-list");
    el.spotlightBody = document.getElementById("spotlight-body");
    el.portfolioBody = document.getElementById("portfolio-body");
    el.newsGrid = document.getElementById("news-grid");
    el.searchInput = document.getElementById("search-input");
    el.searchResults = document.getElementById("search-results");
    el.searchWrap = document.getElementById("search-wrap");
    el.alertsBtn = document.getElementById("alerts-btn");
    el.alertsCount = document.getElementById("alerts-count");
    el.alertsPanel = document.getElementById("alerts-panel");
    el.alertsClose = document.getElementById("alerts-close");
    el.alertsBody = document.getElementById("alerts-body");
    el.scrim = document.getElementById("scrim");
    el.modalOverlay = document.getElementById("modal-overlay");
    el.modalBody = document.getElementById("modal-body");
    el.modalClose = document.getElementById("modal-close");
    el.toastStack = document.getElementById("toast-stack");
  }

  /* ================= Ticker tape ================= */

  function tickerItemHtml(sym) {
    const meta = stocks.get(sym).meta;
    return '<div class="ticker-item" data-symbol="' + sym + '">' +
      '<span class="t-sym">' + sym + '</span><span class="t-name">' + meta.name + '</span>' +
      '<span class="t-price">—</span><span class="t-chg">—</span></div>';
  }

  function renderTickerTapeInitial() {
    const symbols = UNIVERSE.map((m) => m.symbol);
    el.tickerTrack.innerHTML = symbols.concat(symbols).map(tickerItemHtml).join("");
    symbols.forEach((sym) => tickerRefs.set(sym, []));
    el.tickerTrack.querySelectorAll(".ticker-item").forEach((node) => {
      const sym = node.getAttribute("data-symbol");
      tickerRefs.get(sym).push({ price: node.querySelector(".t-price"), chg: node.querySelector(".t-chg") });
    });
  }

  function updateTickerTape() {
    stocks.forEach((st, sym) => {
      const pct = pctChangeToday(sym);
      const up = pct >= 0;
      const refs = tickerRefs.get(sym);
      if (!refs) return;
      refs.forEach((r) => {
        r.price.textContent = fmtPrice(st.history[st.history.length - 1]);
        r.chg.textContent = fmtPct(pct);
        r.chg.className = "t-chg " + (up ? "up" : "down");
      });
    });
  }

  /* ================= Stat row ================= */

  function renderStatRow() {
    let bullish = 0, bearish = 0, neutral = 0;
    UNIVERSE.forEach((m) => {
      const sig = computeSignal(m.symbol).signal;
      if (sig === "Bullish") bullish++; else if (sig === "Bearish") bearish++; else neutral++;
    });
    let mood = "Neutral", moodColor = "neon-yellow";
    if (bullish >= bearish && bullish >= neutral) { mood = "Bullish"; moodColor = "neon-green"; }
    else if (bearish >= bullish && bearish >= neutral) { mood = "Bearish"; moodColor = "neon-pink"; }
    const activeAlerts = alerts.filter((a) => !a.triggeredAt).length;

    const tiles = [
      { icon: "activity", color: "neon-blue", value: String(UNIVERSE.length), label: "Tracked markets" },
      { icon: "star", color: "neon-cyan", value: String(watchlist.length), label: "In your watchlist" },
      { icon: "bell", color: "neon-orange", value: String(activeAlerts), label: "Active alerts" },
      { icon: "sparkle", color: moodColor, value: mood, label: "AI market mood" },
    ];

    el.statRow.innerHTML = tiles.map((t) =>
      '<div class="stat-tile"><span class="icon-badge ' + t.color + '"><svg class="icon"><use href="#icon-' + t.icon + '"/></svg></span>' +
      '<div class="stat-meta"><div class="stat-value">' + t.value + '</div><div class="stat-label">' + t.label + '</div></div></div>'
    ).join("");
  }

  /* ================= Watchlist ================= */

  function watchlistCardHtml(sym) {
    const st = stocks.get(sym);
    const sector = SECTOR_META[st.meta.sector];
    const m = computeSignal(sym);
    const pct = pctChangeToday(sym);
    const up = pct >= 0;
    return '<article class="stock-card" data-symbol="' + sym + '" tabindex="0" role="button" aria-label="Open ' + sym + ' details">' +
      '<div class="stock-card-top">' +
        '<span class="icon-badge neon-' + sector.color + '"><svg class="icon"><use href="#icon-' + sector.icon + '"/></svg></span>' +
        '<div class="stock-id"><span class="sym">' + sym + '</span><span class="name">' + st.meta.name + '</span></div>' +
        '<button class="star-btn" data-action="remove-watchlist" aria-label="Remove ' + sym + ' from watchlist" type="button"><svg class="icon"><use href="#icon-close"/></svg></button>' +
      '</div>' +
      '<div class="stock-price-row"><span class="price">' + fmtPrice(st.history[st.history.length - 1]) + '</span><span class="chg ' + (up ? "up" : "down") + '">' + fmtPct(pct) + '</span></div>' +
      sparkSvg(st.history, up, 200, 44) +
      '<div class="ai-chip ' + m.signal.toLowerCase() + '"><svg class="icon"><use href="#icon-sparkle"/></svg>' + m.signal + ' · ' + m.confidence + '%</div>' +
      '</article>';
  }

  function renderWatchlistInitial() {
    cardRefs.clear();
    if (!watchlist.length) {
      el.watchlistGrid.innerHTML = '<div class="watchlist-empty">Your watchlist is empty — search for a ticker above and add it.</div>';
      return;
    }
    el.watchlistGrid.innerHTML = watchlist.map(watchlistCardHtml).join("");
    el.watchlistGrid.querySelectorAll(".stock-card").forEach((node) => {
      const sym = node.getAttribute("data-symbol");
      cardRefs.set(sym, {
        price: node.querySelector(".price"),
        chg: node.querySelector(".chg"),
        sparkLine: node.querySelector(".spark-line"),
        sparkArea: node.querySelector(".spark-area"),
        chip: node.querySelector(".ai-chip"),
      });
      node.addEventListener("click", (ev) => {
        if (ev.target.closest("[data-action='remove-watchlist']")) return;
        openModal(sym, node);
      });
      node.addEventListener("keydown", (ev) => {
        if (ev.target.closest("[data-action='remove-watchlist']")) return;
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openModal(sym, node); }
      });
      node.querySelector("[data-action='remove-watchlist']").addEventListener("click", (ev) => {
        ev.stopPropagation();
        removeFromWatchlist(sym);
      });
    });
  }

  function updateWatchlistCards() {
    cardRefs.forEach((ref, sym) => {
      const st = stocks.get(sym);
      const pct = pctChangeToday(sym);
      const up = pct >= 0;
      const m = computeSignal(sym);
      ref.price.textContent = fmtPrice(st.history[st.history.length - 1]);
      ref.chg.textContent = fmtPct(pct);
      ref.chg.className = "chg " + (up ? "up" : "down");
      const line = buildLinePath(st.history.slice(-30), 200, 44, 3);
      ref.sparkLine.setAttribute("d", line.d);
      ref.sparkLine.setAttribute("class", "spark-line " + (up ? "up" : "down"));
      ref.sparkArea.setAttribute("d", buildAreaPath(line.d, 200, 44, 3));
      ref.sparkArea.setAttribute("class", "spark-area " + (up ? "up" : "down"));
      ref.chip.className = "ai-chip " + m.signal.toLowerCase();
      ref.chip.innerHTML = '<svg class="icon"><use href="#icon-sparkle"/></svg>' + m.signal + ' · ' + m.confidence + '%';
    });
  }

  function addToWatchlist(sym) {
    if (watchlist.indexOf(sym) !== -1) return;
    watchlist.push(sym);
    saveWatchlist();
    renderWatchlistInitial();
    renderStatRow();
    renderSpotlight();
    showToast("icon-star", "neon-cyan", sym + " added to your watchlist.");
  }

  function removeFromWatchlist(sym) {
    const idx = watchlist.indexOf(sym);
    if (idx === -1) return;
    watchlist.splice(idx, 1);
    saveWatchlist();
    renderWatchlistInitial();
    renderStatRow();
    if (spotlightIndex >= watchlist.length) spotlightIndex = 0;
    renderSpotlight();
  }

  /* ================= Top movers ================= */

  function moverRowHtml(it) {
    const up = it.pct >= 0;
    const sector = SECTOR_META[it.sector];
    return '<button class="mover-row" data-symbol="' + it.symbol + '" type="button">' +
      '<span class="icon-badge neon-' + sector.color + ' icon-badge-xs"><svg class="icon"><use href="#icon-' + sector.icon + '"/></svg></span>' +
      '<span class="sym">' + it.symbol + '</span><span class="chg ' + (up ? "up" : "down") + '">' + fmtPct(it.pct) + '</span></button>';
  }

  function renderMovers() {
    const withPct = UNIVERSE.map((m) => ({ symbol: m.symbol, sector: m.sector, pct: pctChangeToday(m.symbol) }));
    withPct.sort((a, b) => b.pct - a.pct);
    const gainers = withPct.slice(0, 4);
    const losers = withPct.slice(-4).reverse();

    el.moversList.innerHTML = '<div class="movers-cols">' +
      '<div><div class="movers-col-title">Gainers</div>' + gainers.map(moverRowHtml).join("") + '</div>' +
      '<div><div class="movers-col-title">Losers</div>' + losers.map(moverRowHtml).join("") + '</div>' +
      '</div>';

    el.moversList.querySelectorAll(".mover-row").forEach((btn) => {
      btn.addEventListener("click", () => openModal(btn.getAttribute("data-symbol"), btn));
    });
  }

  /* ================= AI spotlight ================= */

  function renderSpotlight() {
    if (!watchlist.length) {
      el.spotlightBody.innerHTML = '<div class="spotlight-card"><p class="spotlight-text">Add a ticker to your watchlist to see live AI insights here.</p></div>';
      return;
    }
    spotlightIndex = spotlightIndex % watchlist.length;
    const sym = watchlist[spotlightIndex];
    const m = computeSignal(sym);
    const circumference = 2 * Math.PI * 45;
    const dash = (m.confidence / 100) * circumference;
    const ringColor = m.signal === "Bullish" ? NEON_HEX.green : m.signal === "Bearish" ? NEON_HEX.pink : NEON_HEX.yellow;

    el.spotlightBody.innerHTML = '<div class="spotlight-card">' +
      '<div class="spotlight-ring-wrap"><svg viewBox="0 0 100 100">' +
        '<circle class="spotlight-ring-bg" cx="50" cy="50" r="45"></circle>' +
        '<circle class="spotlight-ring-value" cx="50" cy="50" r="45" style="stroke:' + ringColor + ';stroke-dasharray:' + dash.toFixed(1) + " " + circumference.toFixed(1) + '"></circle>' +
        '</svg><div class="spotlight-ring-center"><span class="pct">' + m.confidence + '%</span><span class="lbl">' + m.signal + '</span></div></div>' +
      '<div class="spotlight-sym">' + sym + '</div>' +
      '<p class="spotlight-text">' + insightSentence(sym, m) + '</p>' +
      '<button class="spotlight-cta" type="button">View full breakdown</button>' +
      '<div class="spotlight-dots">' + watchlist.map((_, i) => '<span class="' + (i === spotlightIndex ? "active" : "") + '"></span>').join("") + '</div>' +
      '</div>';

    el.spotlightBody.querySelector(".spotlight-cta").addEventListener("click", () => openModal(sym, el.spotlightBody.querySelector(".spotlight-cta")));
  }

  function rotateSpotlight() {
    if (!watchlist.length) return;
    spotlightIndex = (spotlightIndex + 1) % watchlist.length;
    renderSpotlight();
  }

  /* ================= Portfolio ================= */

  function renderPortfolio() {
    let totalValue = 0, totalCost = 0;
    const rows = SAMPLE_PORTFOLIO.map((h) => {
      const price = stocks.get(h.symbol).history[stocks.get(h.symbol).history.length - 1];
      const value = price * h.shares;
      const cost = h.cost * h.shares;
      totalValue += value;
      totalCost += cost;
      return { symbol: h.symbol, shares: h.shares, value, gain: value - cost };
    });
    const totalGain = totalValue - totalCost;
    const totalGainPct = (totalGain / totalCost) * 100;

    const circumference = 2 * Math.PI * 36;
    let cumulative = 0;
    const segments = rows.map((r, i) => {
      const len = (r.value / totalValue) * circumference;
      const seg = { len, offset: -cumulative, color: PORTFOLIO_PALETTE[i % PORTFOLIO_PALETTE.length] };
      cumulative += len;
      return seg;
    });

    const donut = '<svg class="portfolio-donut" viewBox="0 0 84 84">' +
      '<circle cx="42" cy="42" r="36" fill="none" stroke="rgba(15,60,110,.08)" stroke-width="10"></circle>' +
      segments.map((seg) => '<circle cx="42" cy="42" r="36" fill="none" stroke="' + seg.color + '" stroke-width="10" stroke-dasharray="' + seg.len.toFixed(1) + " " + circumference.toFixed(1) + '" stroke-dashoffset="' + seg.offset.toFixed(1) + '"></circle>').join("") +
      '</svg>';

    const legend = rows.map((r, i) => '<div class="legend-row"><span class="legend-dot" style="background:' + segments[i].color + ';color:' + segments[i].color + '"></span><span class="sym">' + r.symbol + '</span><span class="pct">' + ((r.value / totalValue) * 100).toFixed(0) + '%</span></div>').join("");

    const holdings = rows.map((r) => '<div class="holding-row"><span class="sym">' + r.symbol + '</span><span class="shares">' + r.shares + ' sh</span><span class="gain" style="color:' + (r.gain >= 0 ? "var(--up)" : "var(--down)") + '">' + fmtSignedMoney(r.gain) + '</span></div>').join("");

    el.portfolioBody.innerHTML =
      '<div class="portfolio-total"><div><div class="value">' + fmtPrice(totalValue) + '</div><div class="sub">Total market value</div></div>' +
      '<div style="text-align:right"><div class="value" style="font-size:16px;color:' + (totalGain >= 0 ? "var(--up)" : "var(--down)") + '">' + fmtSignedMoney(totalGain) + '</div><div class="sub">' + fmtPct(totalGainPct) + ' all-time</div></div></div>' +
      '<div class="portfolio-donut-row">' + donut + '<div class="portfolio-legend">' + legend + '</div></div>' +
      '<div class="portfolio-holdings">' + holdings + '</div>' +
      '<p class="portfolio-note">Sample holdings for demonstration — not a real brokerage account.</p>';
  }

  /* ================= News ================= */

  function renderNews() {
    const pool = watchlist.length ? watchlist.slice(0, 6) : UNIVERSE.slice(0, 6).map((m) => m.symbol);
    if (!pool.length) { el.newsGrid.innerHTML = '<div class="watchlist-empty">Add tickers to your watchlist to generate Market Pulse headlines.</div>'; return; }
    el.newsGrid.innerHTML = pool.map((sym) => {
      const meta = stocks.get(sym).meta;
      const m = computeSignal(sym);
      const templates = m.signal === "Bullish" ? BULLISH_NEWS : m.signal === "Bearish" ? BEARISH_NEWS : NEUTRAL_NEWS;
      const template = templates[Math.floor(Math.random() * templates.length)];
      const minutesAgo = 1 + Math.floor(Math.random() * 40);
      const sector = SECTOR_META[meta.sector];
      return '<article class="news-card">' +
        '<span class="icon-badge neon-' + sector.color + '"><svg class="icon"><use href="#icon-' + sector.icon + '"/></svg></span>' +
        '<div><p class="headline">' + template.replace("{sym}", sym) + '</p>' +
        '<div class="news-meta"><span>' + sym + '</span><span>·</span><span>' + minutesAgo + 'm ago</span></div></div></article>';
    }).join("");
  }

  /* ================= Search ================= */

  function renderSearchResults(query) {
    const q = query.trim().toUpperCase();
    if (!q) { el.searchResults.hidden = true; el.searchResults.innerHTML = ""; return; }
    const matches = UNIVERSE.filter((m) => m.symbol.indexOf(q) === 0 || m.name.toUpperCase().indexOf(q) !== -1).slice(0, 7);
    if (!matches.length) {
      el.searchResults.innerHTML = '<div class="search-empty">No matches for “' + escapeHtml(query) + '”.</div>';
      el.searchResults.hidden = false;
      return;
    }
    el.searchResults.innerHTML = matches.map((m) => {
      const inWatchlist = watchlist.indexOf(m.symbol) !== -1;
      return '<button class="search-result-item" type="button" role="option" data-symbol="' + m.symbol + '">' +
        '<div class="sr-id"><span class="sr-sym">' + m.symbol + '</span><span class="sr-name">' + m.name + '</span></div>' +
        '<span class="sr-add" data-action="' + (inWatchlist ? "open" : "add") + '">' + (inWatchlist ? "View" : "+ Add") + '</span></button>';
    }).join("");
    el.searchResults.hidden = false;

    el.searchResults.querySelectorAll(".search-result-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sym = btn.getAttribute("data-symbol");
        if (btn.querySelector(".sr-add").getAttribute("data-action") === "add") addToWatchlist(sym);
        el.searchInput.value = "";
        el.searchResults.hidden = true;
        openModal(sym, el.searchInput);
      });
    });
  }

  /* ================= Modal ================= */

  function renderModalShell(sym) {
    const st = stocks.get(sym);
    const sector = SECTOR_META[st.meta.sector];
    const inWatchlist = watchlist.indexOf(sym) !== -1;

    el.modalBody.innerHTML =
      '<div class="modal-header">' +
        '<span class="icon-badge neon-' + sector.color + '"><svg class="icon"><use href="#icon-' + sector.icon + '"/></svg></span>' +
        '<div><div class="m-sym" id="modal-symbol-name">' + sym + '</div><div class="m-name">' + st.meta.name + '</div></div>' +
        '<span class="m-sector">' + st.meta.sector + '</span></div>' +
      '<div class="modal-price-row"><span class="m-price" id="modal-price"></span><span class="chg" id="modal-chg"></span></div>' +
      '<div class="modal-chart-wrap"><svg class="modal-chart" viewBox="0 0 560 150" preserveAspectRatio="none">' +
        '<path class="spark-area" id="modal-area"></path><path class="spark-line" id="modal-line"></path></svg>' +
        '<div class="modal-chart-labels"><span id="modal-low"></span><span id="modal-high"></span></div></div>' +
      '<div class="modal-stats-grid" id="modal-stats"></div>' +
      '<div class="insight-card"><div class="insight-head">' +
        '<span class="icon-badge neon-pink icon-badge-sm"><svg class="icon"><use href="#icon-sparkle"/></svg></span>' +
        '<strong>AI Insight</strong><span class="ai-chip" id="modal-signal-chip" style="margin-left:8px;"></span></div>' +
        '<p id="modal-insight-text"></p></div>' +
      '<div class="alert-form-wrap"><form class="alert-form" id="alert-form">' +
        '<select name="dir" aria-label="Alert direction"><option value="above">Above</option><option value="below">Below</option></select>' +
        '<input type="number" name="target" step="0.01" min="0.01" value="' + st.history[st.history.length - 1].toFixed(2) + '" aria-label="Target price" required>' +
        '<button type="submit">Create Alert</button></form>' +
        '<p class="alert-hint">You’ll get a toast the moment the simulated price crosses your target.</p></div>' +
      '<div style="margin-top:18px;"><button class="spotlight-cta" type="button" id="modal-watchlist-toggle">' + (inWatchlist ? "Remove from watchlist" : "+ Add to watchlist") + '</button></div>';

    modalRefs = {
      price: document.getElementById("modal-price"),
      chg: document.getElementById("modal-chg"),
      area: document.getElementById("modal-area"),
      line: document.getElementById("modal-line"),
      low: document.getElementById("modal-low"),
      high: document.getElementById("modal-high"),
      stats: document.getElementById("modal-stats"),
      signalChip: document.getElementById("modal-signal-chip"),
      insightText: document.getElementById("modal-insight-text"),
      watchlistToggle: document.getElementById("modal-watchlist-toggle"),
    };

    document.getElementById("alert-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const form = ev.target;
      const target = parseFloat(form.target.value);
      if (!isFinite(target) || target <= 0) return;
      addAlert(sym, form.dir.value, target);
      form.target.value = stocks.get(sym).history[stocks.get(sym).history.length - 1].toFixed(2);
    });

    modalRefs.watchlistToggle.addEventListener("click", () => {
      if (watchlist.indexOf(sym) !== -1) removeFromWatchlist(sym); else addToWatchlist(sym);
      modalRefs.watchlistToggle.textContent = watchlist.indexOf(sym) !== -1 ? "Remove from watchlist" : "+ Add to watchlist";
    });

    updateModalDynamic(sym);
  }

  function updateModalDynamic(sym) {
    if (!modalRefs) return;
    const h = stocks.get(sym).history;
    const price = h[h.length - 1];
    const pct = pctChangeToday(sym);
    const up = pct >= 0;
    const m = computeSignal(sym);
    const chart = buildLinePath(h, 560, 150, 4);

    modalRefs.price.textContent = fmtPrice(price);
    modalRefs.chg.textContent = fmtPct(pct);
    modalRefs.chg.className = "chg " + (up ? "up" : "down");
    modalRefs.area.setAttribute("d", buildAreaPath(chart.d, 560, 150, 4));
    modalRefs.area.setAttribute("class", "spark-area " + (up ? "up" : "down"));
    modalRefs.line.setAttribute("d", chart.d);
    modalRefs.line.setAttribute("class", "spark-line " + (up ? "up" : "down"));
    modalRefs.low.textContent = "Low " + fmtPrice(chart.min);
    modalRefs.high.textContent = "High " + fmtPrice(chart.max);
    modalRefs.stats.innerHTML =
      statBox("Session Open", fmtPrice(h[0])) +
      statBox("Session High", fmtPrice(chart.max)) +
      statBox("Session Low", fmtPrice(chart.min)) +
      statBox("SMA 10", fmtPrice(m.sma10)) +
      statBox("RSI (14)", m.rsi.toFixed(0)) +
      statBox("Volatility", m.volatility.label);
    modalRefs.signalChip.textContent = m.signal + " · " + m.confidence + "%";
    modalRefs.signalChip.className = "ai-chip " + m.signal.toLowerCase();
    modalRefs.insightText.textContent = insightSentence(sym, m);
  }

  function updateModalIfOpen() {
    if (activeModalSymbol) updateModalDynamic(activeModalSymbol);
  }

  function openModal(sym, triggerEl) {
    if (!el.alertsPanel.hidden) closeAlertsPanel();
    activeModalSymbol = sym;
    lastFocusedEl = triggerEl || document.activeElement;
    renderModalShell(sym);
    el.modalOverlay.hidden = false;
    el.scrim.hidden = false;
    document.body.style.overflow = "hidden";
    el.modalClose.focus();
  }

  function closeModal() {
    if (el.modalOverlay.hidden) return;
    activeModalSymbol = null;
    modalRefs = null;
    el.modalOverlay.hidden = true;
    if (el.alertsPanel.hidden) { el.scrim.hidden = true; document.body.style.overflow = ""; }
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
  }

  /* ================= Alerts ================= */

  function addAlert(sym, dir, target) {
    alerts.push({ id: uid(), symbol: sym, dir, target, createdAt: Date.now(), triggeredAt: null });
    saveAlerts();
    renderStatRow();
    renderAlertsPanel();
    showToast("icon-bell", "neon-orange", "Alert set: " + sym + " " + dir + " " + fmtPrice(target) + ".");
  }

  function removeAlert(id) {
    alerts = alerts.filter((a) => a.id !== id);
    saveAlerts();
    renderStatRow();
    renderAlertsPanel();
  }

  function checkAlerts() {
    let changed = false;
    alerts.forEach((a) => {
      if (a.triggeredAt) return;
      const price = stocks.get(a.symbol).history[stocks.get(a.symbol).history.length - 1];
      const hit = a.dir === "above" ? price >= a.target : price <= a.target;
      if (hit) {
        a.triggeredAt = Date.now();
        changed = true;
        showToast("icon-bell", "neon-green", a.symbol + " just crossed " + fmtPrice(a.target) + " (" + a.dir + ").");
      }
    });
    if (changed) { saveAlerts(); renderAlertsPanel(); renderStatRow(); }
  }

  function renderAlertsPanel() {
    const active = alerts.filter((a) => !a.triggeredAt).length;
    el.alertsCount.hidden = active === 0;
    el.alertsCount.textContent = String(active);

    if (!alerts.length) {
      el.alertsBody.innerHTML = '<div class="alerts-empty">No alerts yet. Open any stock and set a target price.</div>';
      return;
    }
    const sorted = alerts.slice().sort((a, b) => b.createdAt - a.createdAt);
    el.alertsBody.innerHTML = sorted.map((a) => {
      const price = stocks.get(a.symbol).history[stocks.get(a.symbol).history.length - 1];
      return '<div class="alert-item ' + (a.triggeredAt ? "triggered" : "") + '">' +
        '<div class="alert-item-top"><span class="sym">' + a.symbol + '</span><button class="remove-alert" data-id="' + a.id + '" type="button" aria-label="Remove alert"><svg class="icon"><use href="#icon-close"/></svg></button></div>' +
        '<div class="desc">Alert when price goes ' + a.dir + ' ' + fmtPrice(a.target) + ' (now ' + fmtPrice(price) + ')</div>' +
        (a.triggeredAt ? '<div class="status">Triggered</div>' : '') + '</div>';
    }).join("");

    el.alertsBody.querySelectorAll(".remove-alert").forEach((btn) => btn.addEventListener("click", () => removeAlert(btn.getAttribute("data-id"))));
  }

  function openAlertsPanel() {
    if (!el.modalOverlay.hidden) closeModal();
    lastFocusedEl = document.activeElement;
    el.alertsPanel.hidden = false;
    el.scrim.hidden = false;
    el.alertsBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    el.alertsClose.focus();
  }

  function closeAlertsPanel() {
    if (el.alertsPanel.hidden) return;
    el.alertsPanel.hidden = true;
    if (el.modalOverlay.hidden) { el.scrim.hidden = true; document.body.style.overflow = ""; }
    el.alertsBtn.setAttribute("aria-expanded", "false");
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
  }

  /* ================= Toasts ================= */

  function showToast(icon, color, message) {
    const node = document.createElement("div");
    node.className = "toast glass";
    node.innerHTML = '<span class="icon-badge ' + color + ' icon-badge-sm"><svg class="icon"><use href="#' + icon + '"/></svg></span>' +
      '<span class="toast-text">' + message + '</span>' +
      '<button class="toast-close" type="button" aria-label="Dismiss"><svg class="icon"><use href="#icon-close"/></svg></button>';
    el.toastStack.appendChild(node);
    const remove = () => { node.classList.add("fade-out"); setTimeout(() => node.remove(), 280); };
    node.querySelector(".toast-close").addEventListener("click", remove);
    setTimeout(remove, 6000);
  }

  /* ================= Events & bootstrap ================= */

  function wireEvents() {
    el.searchInput.addEventListener("input", (ev) => renderSearchResults(ev.target.value));
    el.searchInput.addEventListener("focus", (ev) => { if (ev.target.value) renderSearchResults(ev.target.value); });
    el.searchInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const first = el.searchResults.querySelector(".search-result-item");
        if (first) first.click();
      }
    });
    document.addEventListener("click", (ev) => { if (!el.searchWrap.contains(ev.target)) el.searchResults.hidden = true; });

    el.alertsBtn.addEventListener("click", () => { if (el.alertsPanel.hidden) openAlertsPanel(); else closeAlertsPanel(); });
    el.alertsClose.addEventListener("click", closeAlertsPanel);
    el.modalClose.addEventListener("click", closeModal);
    el.modalOverlay.addEventListener("click", (ev) => { if (ev.target === el.modalOverlay) closeModal(); });
    el.scrim.addEventListener("click", () => { closeModal(); closeAlertsPanel(); });

    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (!el.modalOverlay.hidden) closeModal();
      else if (!el.alertsPanel.hidden) closeAlertsPanel();
      else if (!el.searchResults.hidden) el.searchResults.hidden = true;
    });
  }

  function tick() {
    tickStocks();
    updateTickerTape();
    updateWatchlistCards();
    renderMovers();
    renderStatRow();
    renderPortfolio();
    updateModalIfOpen();
    checkAlerts();
  }

  function boot() {
    cacheDom();
    initStocks();
    watchlist = loadWatchlist().filter((sym) => stocks.has(sym));
    alerts = loadAlerts().filter((a) => stocks.has(a.symbol));

    renderTickerTapeInitial();
    updateTickerTape();
    renderStatRow();
    renderWatchlistInitial();
    renderMovers();
    renderSpotlight();
    renderPortfolio();
    renderNews();
    renderAlertsPanel();
    wireEvents();

    setInterval(tick, TICK_MS);
    setInterval(rotateSpotlight, SPOTLIGHT_MS);
    setInterval(renderNews, NEWS_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
