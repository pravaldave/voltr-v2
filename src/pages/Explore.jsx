import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { API_BASE } from '../config';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'AUD'];
const SYMBOLS    = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥', AED: 'د.إ', SGD: 'S$', AUD: 'A$' };

const card = { background: '#ffffff', border: '1px solid #f0ede8', borderRadius: 14 };
const inp  = {
  width: '100%', boxSizing: 'border-box',
  background: '#fafaf8', border: '1px solid #f0ede8',
  borderRadius: 9, color: '#111',
  padding: '10px 14px', fontSize: 13,
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.18s',
};

function PriceChart({ history, period, setPeriod, selected, fxRates, displayCurrency, onLivePriceRaw }) {
  const fxRef  = useRef(fxRates);
  const dcRef  = useRef(displayCurrency);
  useEffect(() => { fxRef.current = fxRates; }, [fxRates]);
  useEffect(() => { dcRef.current = displayCurrency; }, [displayCurrency]);

  const convert = (amount, from) => {
    if (!amount || isNaN(amount)) return 0;
    const rates  = fxRef.current;
    const target = dcRef.current;
    if (!from || from === target) return amount;
    const toUSD = from === 'USD' ? amount : amount / (rates[from] || 1);
    return target === 'USD' ? toUSD : toUSD * (rates[target] || 1);
  };

  useEffect(() => {
    if (!selected || !history || history.error) return;
    const iv = setInterval(async () => {
      try {
        const r    = await fetch(`${API_BASE}/price?name=${encodeURIComponent(selected)}`);
        const data = await r.json();
        if (data.price && onLivePriceRaw) onLivePriceRaw(data.price, data.currency || history.currency);
      } catch {}
    }, 60000);
    return () => clearInterval(iv);
  }, [selected, history]);

  if (!history) return <div style={{ height: 320, background: '#fafaf8', borderRadius: 10 }} />;
  if (history.error) return (
    <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', background: '#fafaf8', borderRadius: 10 }}>
      {history.error}
    </div>
  );

  const seriesData = history.dates.map((d, i) => ({
    x: history.is_unix ? d * 1000 : new Date(d).getTime(),
    y: [
      parseFloat(convert(history.open[i],  history.currency).toFixed(4)),
      parseFloat(convert(history.high[i],  history.currency).toFixed(4)),
      parseFloat(convert(history.low[i],   history.currency).toFixed(4)),
      parseFloat(convert(history.close[i], history.currency).toFixed(4)),
    ],
  })).filter(d => d.y.every(v => v != null && !isNaN(v)));

  const options = {
    chart: { type: 'candlestick', height: 320, background: 'transparent', toolbar: { show: false }, animations: { enabled: false } },
    theme: { mode: 'light' },
    xaxis: { type: 'datetime', labels: { style: { colors: '#aaa', fontSize: '11px' }, datetimeUTC: false }, axisBorder: { color: '#f0ede8' }, axisTicks: { color: '#f0ede8' } },
    yaxis: { tooltip: { enabled: true }, labels: { style: { colors: '#aaa', fontSize: '11px' }, formatter: v => v?.toLocaleString(undefined, { maximumFractionDigits: 2 }) } },
    grid: { borderColor: '#f0ede8' },
    plotOptions: { candlestick: { colors: { upward: '#16a34a', downward: '#c0392b' }, wick: { useFillColor: true } } },
    tooltip: { theme: 'light', x: { format: 'dd MMM yyyy' } },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 3, background: '#f7f4f0', borderRadius: 8, padding: 3 }}>
          {['1d', '1mo', '3mo', '6mo', '1y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11, border: 'none', cursor: 'pointer',
              background: period === p ? '#111' : 'transparent',
              color:      period === p ? '#fff' : '#aaa',
              fontWeight: period === p ? 700 : 400,
              transition: 'all 0.15s',
            }}>{p}</button>
          ))}
        </div>
      </div>
      <ReactApexChart
  key={`chart-${selected}-${period}-${displayCurrency}`}
        type="candlestick"
        series={[{ data: seriesData }]}
        options={options}
        height={320}
      />
    </div>
  );
}

function PriceHeader({ history, fxRates, displayCurrency, livePriceRaw, liveCurrencyRaw }) {
  if (!history || history.error) return null;
  const sym     = SYMBOLS[displayCurrency] || displayCurrency;
  const convert = (amount, from) => {
    if (!amount || isNaN(amount)) return 0;
    if (!from || from === displayCurrency) return amount;
    const toUSD = from === 'USD' ? amount : amount / (fxRates[from] || 1);
    return displayCurrency === 'USD' ? toUSD : toUSD * (fxRates[displayCurrency] || 1);
  };
  const closes = (history?.close || []).filter(v => v != null);
  const first  = convert(closes[0] || 0, history?.currency);
  const lastRaw = convert(closes[closes.length - 1] || 0, history?.currency);
  const last    = livePriceRaw ? convert(livePriceRaw, liveCurrencyRaw) : lastRaw;
  const up  = last >= first;
  const pct = first > 0 ? (((last - first) / first) * 100).toFixed(2) : '0.00';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
      <span style={{ fontFamily: 'Courier New, monospace', fontSize: 30, fontWeight: 700, color: '#111' }}>
        {sym}{last?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      {first > 0 && (
        <span style={{ fontFamily: 'Courier New, monospace', fontSize: 14, fontWeight: 700, color: up ? '#9A3412' : '#7f1d1d',
          background: up ? '#fff7f0' : '#fff0f0', padding: '3px 8px', borderRadius: 6 }}>
          {up ? '+' : ''}{pct}%
        </span>
      )}
    </div>
  );
}

function RSIChart({ rsi, dates }) {
  if (!rsi || !dates) return null;
  const data    = dates.map((d, i) => ({ date: typeof d === 'number' ? new Date(d * 1000).toISOString().slice(0, 10) : d, rsi: rsi[i] }));
  const current = rsi.filter(Boolean).slice(-1)[0];
  const color   = current > 70 ? '#c0392b' : current < 30 ? '#16a34a' : '#555';
  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px' }}>RSI (14)</span>
        <span style={{ fontFamily: 'Courier New, monospace', fontSize: 14, fontWeight: 700, color }}>{current?.toFixed(1)}</span>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#bbb' }} width={26} />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f0ede8', borderRadius: 8 }} labelStyle={{ color: '#aaa', fontSize: 11 }} formatter={v => [v?.toFixed(1), 'RSI']} />
          <ReferenceLine y={70} stroke="#c0392b" strokeDasharray="3 3" />
          <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="rsi" stroke="#111" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
        <span style={{ color: '#c0392b' }}>Overbought &gt;70</span>
        <span style={{ color: '#9A3412' }}>Oversold &lt;30</span>
        <span style={{ color: '#bbb' }}>Neutral 30–70</span>
      </div>
    </div>
  );
}

function MACDChart({ macd, dates }) {
  if (!macd || !dates) return null;
  const data = dates.map((d, i) => ({
    date: typeof d === 'number' ? new Date(d * 1000).toISOString().slice(0, 10) : d,
    macd: macd.macd[i], signal: macd.signal[i],
  }));
  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>MACD</div>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis tick={{ fontSize: 10, fill: '#bbb' }} width={38} />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f0ede8', borderRadius: 8 }} labelStyle={{ color: '#aaa', fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#f0ede8" />
          <Line type="monotone" dataKey="macd"   stroke="#111"    dot={false} strokeWidth={1.5} name="MACD" />
          <Line type="monotone" dataKey="signal" stroke="#16a34a" dot={false} strokeWidth={1.5} name="Signal" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FinancialsCard({ fin, fxRates, displayCurrency }) {
  if (!fin || Object.keys(fin).length === 0) return null;
  const sym  = SYMBOLS[displayCurrency] || displayCurrency;
  const conv = (amount, from = 'USD') => {
    if (!amount || isNaN(amount)) return 0;
    if (from === displayCurrency) return amount;
    const toUSD = from === 'USD' ? amount : amount / (fxRates[from] || 1);
    return displayCurrency === 'USD' ? toUSD : toUSD * (fxRates[displayCurrency] || 1);
  };
  const rows = [
    { label: 'Market Cap',    value: fin.market_cap ? `${sym}${(conv(fin.market_cap) / 1e9).toFixed(1)}B` : '—' },
    { label: 'P/E Ratio',    value: fin.pe_ratio?.toFixed(1) ?? '—' },
    { label: 'P/B Ratio',    value: fin.pb_ratio?.toFixed(2) ?? '—' },
    { label: 'Profit Margin',value: fin.profit_margin ? `${(fin.profit_margin * 100).toFixed(1)}%` : '—' },
    { label: 'Revenue',      value: fin.revenue ? `${sym}${(conv(fin.revenue) / 1e9).toFixed(1)}B` : '—' },
    { label: '52W High',     value: fin['52w_high'] ? `${sym}${conv(fin['52w_high']).toFixed(2)}` : '—' },
    { label: '52W Low',      value: fin['52w_low']  ? `${sym}${conv(fin['52w_low']).toFixed(2)}`  : '—' },
    { label: 'Dividend',     value: fin.dividend ? `${(fin.dividend * 100).toFixed(2)}%` : '—' },
    { label: 'Sector',       value: fin.sector || '—' },
    { label: 'Industry',     value: fin.industry || '—' },
    { label: 'Employees',    value: fin.employees?.toLocaleString() ?? '—' },
  ];
  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Fundamentals</div>
      {fin.description && <p style={{ fontSize: 12, color: '#777', marginBottom: 14, lineHeight: 1.6, borderBottom: '1px solid #f0ede8', paddingBottom: 12 }}>{fin.description}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #fafaf8', fontSize: 12 }}>
            <span style={{ color: '#bbb' }}>{r.label}</span>
            <span style={{ color: '#111', fontWeight: 600, fontFamily: 'Courier New, monospace' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ articles }) {
  if (!articles?.length) return null;
  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Latest News</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {articles.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block', padding: '8px', margin: '-8px', borderRadius: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontSize: 13, color: '#111', lineHeight: 1.5, marginBottom: 3 }}>{a.title}</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>{a.source} · {a.date}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Explore() {
  const [query,           setQuery]           = useState('');
  const [suggestions,     setSuggestions]     = useState([]);
  const [selected,        setSelected]        = useState('');
  const [period,          setPeriod]          = useState('3mo');
  const [history,         setHistory]         = useState(null);
  const [indicators,      setIndicators]      = useState(null);
  const [financials,      setFinancials]      = useState(null);
  const [news,            setNews]            = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [fxRates,         setFxRates]         = useState({ USD: 1 });
  const [livePriceRaw,    setLivePriceRaw]    = useState(null);
  const [liveCurrencyRaw, setLiveCurrencyRaw] = useState('USD');
  const isSelectingRef = useRef(false);
  const searchRef      = useRef(null);

  useEffect(() => {
    const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    setFxRates({ USD: 1, INR: 84.5, EUR: 0.92, GBP: 0.79, JPY: 149.5, AED: 3.67, SGD: 1.34, AUD: 1.53 });
  }, []);

  useEffect(() => {
    if (isSelectingRef.current) { isSelectingRef.current = false; return; }
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        setSuggestions(r.data.results || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const loadAsset = async (value, display) => {
    isSelectingRef.current = true;
    setSuggestions([]);
    setSelected(value);
    setQuery(display);
    setHistory(null); setIndicators(null); setFinancials(null); setNews([]);
    setLoading(true); setLivePriceRaw(null);
    const [h, ind, fin, n] = await Promise.allSettled([
      axios.get(`${API_BASE}/history`,    { params: { name: value, period } }).then(r => r.data),
      axios.get(`${API_BASE}/indicators`, { params: { name: value, period } }).then(r => r.data),
      axios.get(`${API_BASE}/financials`, { params: { name: value } }).then(r => r.data),
      axios.get(`${API_BASE}/news`,       { params: { name: value } }).then(r => r.data.articles),
    ]);
    setHistory(h.status    === 'fulfilled' ? h.value   : { error: 'Data unavailable' });
    setIndicators(ind.status === 'fulfilled' ? ind.value : null);
    setFinancials(fin.status === 'fulfilled' ? fin.value : {});
    setNews(n.status       === 'fulfilled' ? n.value   : []);
    setLoading(false);
  };

  const handlePeriodChange = p => { setPeriod(p); if (selected) loadAsset(selected, query); };

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 18, background: '#111', borderRadius: 2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px' }}>
  Markets · 03
</span>
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', marginBottom: 4 }}>Explore</h1>
        <p style={{ fontSize: 13, color: '#aaa' }}>Search any stock, crypto, commodity or forex pair</p>
      </div>

      {/* Search row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
        <div style={{ position: 'relative', flex: 1 }} ref={searchRef}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search TCS, Bitcoin, Gold, USD/INR, NVDA…"
            style={{ ...inp, paddingLeft: 36, paddingTop: 12, paddingBottom: 12 }}
            onFocus={e => e.target.style.borderColor = '#111'}
            onBlur={e  => e.target.style.borderColor = '#f0ede8'}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, background: '#fff', border: '1px solid #f0ede8', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {suggestions.map(s => (
                <div key={s.value} onClick={() => loadAsset(s.value, s.display)}
                  style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #fafaf8', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <span style={{ color: '#111' }}>{s.display}</span>
                  <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#bbb' }}>{(s.value || '').split('.')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>Currency</div>
          <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
            style={{ ...inp, width: 'auto', paddingTop: 12, paddingBottom: 12, cursor: 'pointer' }}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!selected && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⌕</div>
          <div style={{ fontSize: 15, color: '#aaa' }}>Search for any asset to see charts, indicators and news</div>
          <div style={{ fontSize: 12, color: '#ccc', marginTop: 6 }}>Stocks · Crypto · Commodities · Forex</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[320, 120, 120].map((h, i) => (
            <div key={i} style={{ height: h, background: '#f7f4f0', borderRadius: 14 }} />
          ))}
        </div>
      )}

      {/* Content */}
      {selected && !loading && history && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...card, padding: 22 }}>
            <PriceHeader history={history} fxRates={fxRates} displayCurrency={displayCurrency} livePriceRaw={livePriceRaw} liveCurrencyRaw={liveCurrencyRaw} />
            <PriceChart
              key={`${selected}-${period}`}
              history={history} period={period} setPeriod={handlePeriodChange}
              selected={selected} fxRates={fxRates} displayCurrency={displayCurrency}
              onLivePriceRaw={(p, c) => { setLivePriceRaw(p); setLiveCurrencyRaw(c); }}
            />
          </div>
          {indicators?.rsi && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <RSIChart  rsi={indicators.rsi}   dates={history?.dates ?? []} />
              {indicators?.macd && <MACDChart macd={indicators.macd} dates={history?.dates ?? []} />}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FinancialsCard fin={financials} fxRates={fxRates} displayCurrency={displayCurrency} />
            <NewsCard articles={news} />
          </div>
        </div>
      )}
    </div>
  );
}
