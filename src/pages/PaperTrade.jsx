import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';
import { API_BASE } from '../config';

const fmt    = (n, d = 2) => n == null || isNaN(n) ? '—' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtPct = n => n == null || isNaN(n) ? '—' : (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
const fmtQty = n => n == null ? '—' : Number(n).toLocaleString('en-IN');

const card = { background: '#ffffff', border: '1px solid #f0ede8', borderRadius: 14 };
const inp  = {
  width: '100%', boxSizing: 'border-box',
  background: '#fafaf8', border: '1px solid #f0ede8',
  borderRadius: 9, color: '#111',
  padding: '10px 14px', fontSize: 13,
  marginBottom: 14, outline: 'none', fontFamily: 'inherit',
};
const lbl = { display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 };

const TABS = ['Trade', 'Positions', 'History', 'Analytics'];

function TradeChart({ symbol, period, setPeriod }) {
  const [history, setHistory] = useState(null);
  useEffect(() => {
    if (!symbol) return;
    setHistory(null);
    axios.get(`${API_BASE}/history?name=${encodeURIComponent(symbol)}&period=${period}`)
      .then(r => setHistory(r.data)).catch(() => setHistory({ error: true }));
  }, [symbol, period]);

  const empty = msg => <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13 }}>{msg}</div>;
  if (!symbol)        return empty('Select a symbol to see the chart');
  if (!history)       return empty('Loading chart…');
  if (history.error)  return empty('Chart unavailable');

  const seriesData = (history.dates || []).map((d, i) => ({
    x: history.is_unix ? d * 1000 : new Date(d).getTime(),
    y: [
      parseFloat((history.open?.[i]  || 0).toFixed(4)),
      parseFloat((history.high?.[i]  || 0).toFixed(4)),
      parseFloat((history.low?.[i]   || 0).toFixed(4)),
      parseFloat((history.close?.[i] || 0).toFixed(4)),
    ],
  })).filter(d => d.y.every(v => !isNaN(v) && v > 0));

  const options = {
    chart: { type: 'candlestick', background: 'transparent', toolbar: { show: false }, animations: { enabled: false } },
    theme: { mode: 'light' },
    xaxis: { type: 'datetime', labels: { style: { colors: '#aaa', fontSize: '10px' }, datetimeUTC: false } },
    yaxis: { labels: { style: { colors: '#aaa', fontSize: '10px' }, formatter: v => v?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) } },
    grid: { borderColor: '#f0ede8' },
    plotOptions: { candlestick: { colors: { upward: '#16a34a', downward: '#c0392b' }, wick: { useFillColor: true } } },
    tooltip: { theme: 'light', x: { format: 'dd MMM yy HH:mm' } },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 3, background: '#f7f4f0', borderRadius: 8, padding: 3 }}>
          {['1d', '1mo', '3mo', '6mo', '1y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              background: period === p ? '#111' : 'transparent', border: 'none',
              color: period === p ? '#fff' : '#aaa',
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
              fontWeight: period === p ? 700 : 400,
            }}>{p}</button>
          ))}
        </div>
      </div>
      <ReactApexChart key={`${symbol}-${period}`} type="candlestick" series={[{ data: seriesData }]} options={options} height={260} />
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'Courier New, monospace', color: color || '#111', fontWeight: 600, fontSize: 13 }}>{value}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
      <span style={{ color: '#aaa' }}>{label}</span>
      <span style={{ fontFamily: 'Courier New, monospace', color: bold ? '#111' : '#555', fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

export default function PaperTrade() {
  const [tab, setTab]             = useState('Trade');
  const [account, setAccount]     = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [searchQuery,    setSearchQuery]    = useState('');
  const [suggestions,    setSuggestions]    = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [livePrice,      setLivePrice]      = useState(null);
  const [priceLoading,   setPriceLoading]   = useState(false);
  const [side,           setSide]           = useState('buy');
  const [qty,            setQty]            = useState('');
  const [orderType,      setOrderType]      = useState('market');
  const [limitPrice,     setLimitPrice]     = useState('');
  const [tradeMsg,       setTradeMsg]       = useState(null);
  const [tradeLoading,   setTradeLoading]   = useState(false);
  const [stopLoss,       setStopLoss]       = useState('');
  const [takeProfit,     setTakeProfit]     = useState('');
  const [chartPeriod,    setChartPeriod]    = useState('1mo');
  const [exitPosition,   setExitPosition]   = useState(null);
  const [exitQty,        setExitQty]        = useState('');
  const [exitLoading,    setExitLoading]    = useState(false);
  const [exitMsg,        setExitMsg]        = useState(null);
  const suppressSearch = React.useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [accRes, posRes, tradeRes] = await Promise.all([
        axios.get(`${API_BASE}/paper/account`),
        axios.get(`${API_BASE}/paper/positions`),
        axios.get(`${API_BASE}/paper/trades`),
      ]);
      setAccount(accRes.data);
      setPositions(posRes.data?.positions || []);
      setTrades(tradeRes.data?.trades || []);
      setError(null);
    } catch { setError('Could not load paper trading data. Is the backend running?'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      if (suppressSearch.current) { suppressSearch.current = false; return; }
      try {
        const res = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions((res.data?.results || []).map(r => ({
          symbol: r.value, name: r.display,
          type: r.value?.includes('Commodity') ? 'Commodity' : r.value?.includes('Crypto') ? 'Crypto' : r.value?.includes('Forex') ? 'Forex' : 'Stock',
        })));
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedSymbol) { setLivePrice(null); return; }
    const fetch_ = async () => {
      setPriceLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/price?name=${encodeURIComponent(selectedSymbol.symbol)}`);
        setLivePrice(res.data?.price || null);
      } catch { setLivePrice(null); }
      finally { setPriceLoading(false); }
    };
    fetch_();
    const iv = setInterval(fetch_, 15000);
    return () => clearInterval(iv);
  }, [selectedSymbol]);

  const selectSymbol = s => {
    suppressSearch.current = true;
    const m  = s.symbol?.match(/\(([^)]+)\)$/);
    const bc = m ? m[1] : null;
    const special = ['Crypto', 'Commodity', 'Forex'];
    const clean = bc && !special.includes(bc) ? bc : s.name;
    setSelectedSymbol({ ...s, symbol: clean });
    setSearchQuery(s.name || clean);
    setSuggestions([]);
    setTradeMsg(null); setQty(''); setLimitPrice('');
  };

  const effectivePrice  = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : livePrice;
  const estimatedValue  = effectivePrice && qty ? effectivePrice * parseFloat(qty) : null;
  const slippage        = livePrice ? livePrice * (side === 'buy' ? 0.001 : -0.001) : null;
  const totalCost_      = estimatedValue ? estimatedValue + estimatedValue * 0.0005 + (side === 'buy' ? (slippage || 0) * parseFloat(qty || 0) : 0) : null;

  const handleTrade = async () => {
    if (!selectedSymbol || !qty || parseFloat(qty) <= 0) {
      setTradeMsg({ type: 'error', text: 'Please select a symbol and enter a valid quantity.' }); return;
    }
    setTradeLoading(true); setTradeMsg(null);
    try {
      const payload = { symbol: selectedSymbol.symbol, name: selectedSymbol.name, side, quantity: parseFloat(qty), order_type: orderType };
      if (orderType === 'limit' && limitPrice) payload.limit_price = parseFloat(limitPrice);
      if (stopLoss)   payload.stop_loss   = parseFloat(stopLoss);
      if (takeProfit) payload.take_profit = parseFloat(takeProfit);
      const res = await axios.post(`${API_BASE}/paper/trade`, payload);
      setTradeMsg({ type: 'success', text: res.data?.message || 'Trade executed!' });
      setQty(''); setLimitPrice(''); setStopLoss(''); setTakeProfit('');
      fetchAll();
    } catch (e) { setTradeMsg({ type: 'error', text: e.response?.data?.detail || 'Trade failed.' }); }
    finally { setTradeLoading(false); }
  };

  const handleExit = async () => {
    if (!exitPosition || !exitQty || parseFloat(exitQty) <= 0) {
      setExitMsg({ type: 'error', text: 'Enter a valid quantity.' }); return;
    }
    setExitLoading(true); setExitMsg(null);
    try {
      const res = await axios.post(`${API_BASE}/paper/trade`, { symbol: exitPosition.symbol, name: exitPosition.name || exitPosition.symbol, side: 'sell', quantity: parseFloat(exitQty), order_type: 'market' });
      setExitMsg({ type: 'success', text: res.data?.message || 'Position closed!' });
      fetchAll();
      setTimeout(() => { setExitPosition(null); setExitMsg(null); setExitQty(''); }, 2000);
    } catch (e) { setExitMsg({ type: 'error', text: e.response?.data?.detail || 'Exit failed.' }); }
    finally { setExitLoading(false); }
  };

  const resetAccount = async () => {
    if (!window.confirm('Reset account? All positions and history will be cleared.')) return;
    try {
      await axios.post(`${API_BASE}/paper/reset`);
      fetchAll();
      setTradeMsg({ type: 'success', text: 'Account reset to ₹10,00,000.' });
    } catch { setTradeMsg({ type: 'error', text: 'Reset failed.' }); }
  };

  const totalInvested = positions.reduce((s, p) => s + (p.avg_price || 0) * (p.quantity || 0), 0);
  const totalCurrent  = positions.reduce((s, p) => s + (p.current_price || p.avg_price || 0) * (p.quantity || 0), 0);
  const unrealizedPnL = totalCurrent - totalInvested;
  const realizedPnL   = trades.filter(t => t.side === 'sell').reduce((s, t) => s + (t.pnl || 0), 0);
  const winTrades     = trades.filter(t => t.side === 'sell' && (t.pnl || 0) > 0).length;
  const closedTrades  = trades.filter(t => t.side === 'sell').length;
  const winRate       = closedTrades > 0 ? ((winTrades / closedTrades) * 100).toFixed(1) : null;

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div style={{ width: 32, height: 32, border: '3px solid #f0ede8', borderTopColor: '#E85D04', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><p style={{ color: '#bbb', marginTop: 14 }}>Loading paper trading engine…</p></div>;
  if (error)   return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div style={{ fontSize: 36 }}>⚠️</div><p style={{ color: '#c0392b', marginTop: 8 }}>{error}</p></div>;

  const msgStyle = ok => ({ background: ok ? '#fff7f0' : '#fff0f0', border: `1px solid ${ok ? '#fdd5a8' : '#fecaca'}`, color: ok ? '#9A3412' : '#7f1d1d', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 14 });

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1200 }}>

      {/* Exit modal */}
      {exitPosition && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', border: '1px solid #f0ede8', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h3 style={{ color: '#111', marginTop: 0, marginBottom: 4 }}>Exit Position</h3>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 20 }}>{exitPosition.name} · Holding: {fmtQty(exitPosition.quantity)} · Avg: {fmt(exitPosition.avg_price)}</p>
            <div style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 9, padding: 14, marginBottom: 16 }}>
              <Row label="Current Price" value={fmt(exitPosition.current_price || exitPosition.avg_price)} />
              <Row label="Unrealized P&L" value={fmt(Math.abs(((exitPosition.current_price || exitPosition.avg_price) - exitPosition.avg_price) * exitPosition.quantity))} />
            </div>
            <label style={lbl}>Quantity to sell</label>
            <input style={inp} type="number" placeholder="0" value={exitQty} onChange={e => setExitQty(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => setExitQty(String(Math.floor(exitPosition.quantity * pct / 100) || 1))}
                  style={{ background: '#f7f4f0', border: '1px solid #f0ede8', color: '#555', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  {pct}%
                </button>
              ))}
            </div>
            {exitMsg && <div style={msgStyle(exitMsg.type === 'success')}>{exitMsg.text}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setExitPosition(null); setExitMsg(null); setExitQty(''); }} style={{ flex: 1, background: '#fafaf8', border: '1px solid #f0ede8', color: '#777', padding: '11px 0', borderRadius: 9, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleExit} disabled={exitLoading} style={{ flex: 2, background: '#c0392b', border: 'none', color: '#fff', padding: '11px 0', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: exitLoading ? 0.6 : 1 }}>
                {exitLoading ? 'Selling…' : `SELL ${exitQty || ''} ${exitPosition.symbol}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 3, height: 18, background: '#111', borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px' }}>Simulator · 04</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', marginBottom: 4 }}>Paper Trading</h1>
          <p style={{ fontSize: 13, color: '#aaa' }}>Virtual ₹10,00,000 · 0.1% slippage · 0.05% commission · Live prices</p>
        </div>
        <button onClick={resetAccount} style={{ background: 'transparent', border: '1px solid #f0ede8', color: '#777', padding: '10px 18px', borderRadius: 9, cursor: 'pointer', fontSize: 13 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0ede8'; e.currentTarget.style.color = '#777'; }}>
          ↺ Reset Account
        </button>
      </div>

      {/* Account summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Portfolio Value', value: fmt(account?.portfolio_value), color: '#111', highlight: true },
          { label: 'Cash Balance',    value: fmt(account?.cash_balance),    color: '#111' },
          { label: 'Invested',        value: fmt(totalInvested),            color: '#111' },
          { label: 'Unrealized P&L',  value: fmt(Math.abs(unrealizedPnL)), color: unrealizedPnL >= 0 ? '#9A3412' : '#7f1d1d', pnl: unrealizedPnL },
          { label: 'Realized P&L',    value: fmt(Math.abs(realizedPnL)),   color: realizedPnL   >= 0 ? '#9A3412' : '#7f1d1d', pnl: realizedPnL },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 150px', ...card, padding: '16px 18px', borderColor: s.highlight ? '#E85D04' : '#f0ede8' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 18, fontWeight: 700, color: s.color }}>
              {s.pnl != null && (s.pnl >= 0 ? '+' : '−')}{s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid #f0ede8' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid #E85D04' : '2px solid transparent',
            color: tab === t ? '#111' : '#aaa',
            padding: '10px 20px', cursor: 'pointer', fontSize: 14,
            fontWeight: tab === t ? 700 : 400, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Trade tab */}
      {tab === 'Trade' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Order form */}
          <div style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 20, marginTop: 0 }}>New Order</h3>

            <label style={lbl}>Search Symbol</label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input style={{ ...inp, marginBottom: 0 }} placeholder="Reliance, TCS, Bitcoin, Gold, USD/INR…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedSymbol(null); setLivePrice(null); }} />
              {suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #f0ede8', borderRadius: 9, zIndex: 100, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                  {suggestions.slice(0, 8).map((s, i) => (
                    <div key={i} onClick={() => selectSymbol(s)} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #fafaf8', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontWeight: 600, color: '#111' }}>{s.name}</span>
                      <span style={{ color: '#bbb', fontSize: 11 }}>{s.symbol}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#777', background: '#f7f4f0', padding: '2px 6px', borderRadius: 4 }}>{s.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedSymbol && (
              <div style={{ display: 'flex', alignItems: 'center', background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 9, padding: '12px 16px', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111', fontSize: 13 }}>{selectedSymbol.name}</div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#bbb' }}>{selectedSymbol.symbol}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontWeight: 800, fontSize: 22, color: '#111' }}>
                    {priceLoading ? '…' : livePrice ? fmt(livePrice) : 'Unavailable'}
                  </div>
                  {livePrice && <div style={{ fontSize: 11, color: '#E85D04', fontWeight: 600 }}>● Live</div>}
                </div>
              </div>
            )}

            {/* Buy / Sell toggle */}
            <div style={{ display: 'flex', marginBottom: 16, borderRadius: 9, overflow: 'hidden', border: '1px solid #f0ede8' }}>
              <button onClick={() => setSide('buy')} style={{ flex: 1, border: 'none', padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: side === 'buy' ? '#fff7f0' : '#fafaf8', color: side === 'buy' ? '#9A3412' : '#bbb', transition: 'all 0.15s' }}>BUY / LONG</button>
              <button onClick={() => setSide('sell')} style={{ flex: 1, border: 'none', padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: side === 'sell' ? '#fff0f0' : '#fafaf8', color: side === 'sell' ? '#7f1d1d' : '#bbb', transition: 'all 0.15s' }}>SELL / SHORT</button>
            </div>

            <label style={lbl}>Order Type</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['market', 'limit'].map(ot => (
                <button key={ot} onClick={() => setOrderType(ot)} style={{ flex: 1, background: orderType === ot ? '#111' : '#fafaf8', border: '1px solid #f0ede8', color: orderType === ot ? '#fff' : '#777', padding: '8px 16px', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: orderType === ot ? 700 : 400 }}>
                  {ot.charAt(0).toUpperCase() + ot.slice(1)}
                </button>
              ))}
            </div>

            {orderType === 'limit' && (
              <>
                <label style={lbl}>Limit Price (₹)</label>
                <input style={inp} type="number" placeholder="Enter limit price" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} />
              </>
            )}

            <label style={lbl}>Quantity</label>
            <input style={inp} type="number" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Stop Loss (₹)</label>
                <input style={{ ...inp, borderColor: stopLoss ? '#c0392b' : '#f0ede8' }} type="number" placeholder="Optional" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Take Profit (₹)</label>
                <input style={{ ...inp, borderColor: takeProfit ? '#E85D04' : '#f0ede8' }} type="number" placeholder="Optional" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} />
              </div>
            </div>

            {livePrice && account?.cash_balance && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {[10, 25, 50].map(pct => {
                  const q = Math.floor(account.cash_balance * pct / 100 / livePrice);
                  return <button key={pct} onClick={() => setQty(String(q > 0 ? q : 1))} style={{ background: '#f7f4f0', border: '1px solid #f0ede8', color: '#555', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{pct}%</button>;
                })}
                <button onClick={() => setQty(String(Math.floor(account.cash_balance / livePrice)))} style={{ background: '#f7f4f0', border: '1px solid #f0ede8', color: '#555', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Max</button>
              </div>
            )}

            {estimatedValue != null && (
              <div style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 9, padding: 14, marginBottom: 14 }}>
                <Row label="Price"            value={fmt(effectivePrice)} />
                <Row label="Quantity"         value={fmtQty(qty)} />
                <Row label="Gross Value"      value={fmt(estimatedValue)} />
                <Row label="Slippage (0.1%)"  value={fmt(Math.abs((slippage || 0) * parseFloat(qty || 0)))} />
                <Row label="Commission (0.05%)" value={fmt(estimatedValue * 0.0005)} />
                <div style={{ borderTop: '1px solid #f0ede8', marginTop: 8, paddingTop: 8 }}>
                  <Row label="Total" value={fmt(totalCost_)} bold />
                </div>
                {account?.cash_balance < totalCost_ && side === 'buy' && (
                  <p style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>⚠ Need {fmt(totalCost_ - account.cash_balance)} more</p>
                )}
              </div>
            )}

            {tradeMsg && <div style={msgStyle(tradeMsg.type === 'success')}>{tradeMsg.text}</div>}

            <button onClick={handleTrade} disabled={tradeLoading || !selectedSymbol} style={{
              width: '100%', border: 'none', color: '#fff',
              padding: '13px 0', borderRadius: 9, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, letterSpacing: '0.5px',
              background: side === 'buy' ? '#E85D04' : '#c0392b',
              opacity: tradeLoading || !selectedSymbol ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}>
              {tradeLoading ? 'Executing…' : `${side === 'buy' ? 'BUY' : 'SELL'} ${selectedSymbol?.symbol || ''}`}
            </button>
          </div>

          {/* Chart + mini positions */}
          <div>
            <div style={{ ...card, padding: 22, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 12, marginTop: 0 }}>
                {selectedSymbol ? `${selectedSymbol.name} Chart` : 'Chart'}
              </h3>
              <TradeChart symbol={selectedSymbol?.symbol} period={chartPeriod} setPeriod={setChartPeriod} />
            </div>
            <div style={{ ...card, padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, marginTop: 0 }}>Open Positions ({positions.length})</h3>
              {positions.length === 0 ? (
                <div style={{ color: '#bbb', textAlign: 'center', padding: '28px 0', fontSize: 13 }}>No open positions yet.</div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {positions.map((p, i) => {
                    const pnl    = ((p.current_price || p.avg_price) - p.avg_price) * p.quantity;
                    const pnlPct = p.avg_price > 0 ? (pnl / (p.avg_price * p.quantity)) * 100 : 0;
                    return (
                      <div key={i} style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 9, padding: '12px 14px', marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#111', fontSize: 14 }}>{p.symbol}</span>
                            <span style={{ color: '#bbb', fontSize: 11, marginLeft: 6 }}>{p.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 700, color: pnlPct >= 0 ? '#9A3412' : '#7f1d1d' }}>{pnlPct >= 0 ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}%</span>
                            <button onClick={() => { setExitPosition(p); setExitQty(String(p.quantity)); setExitMsg(null); }}
                              style={{ background: '#fff0f0', border: '1px solid #fecaca', color: '#c0392b', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Exit</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <MiniStat label="Qty"  value={fmtQty(p.quantity)} />
                          <MiniStat label="Avg"  value={fmt(p.avg_price)} />
                          <MiniStat label="LTP"  value={fmt(p.current_price)} />
                          <MiniStat label="P&L"  value={fmt(Math.abs(pnl))} color={pnl >= 0 ? '#9A3412' : '#7f1d1d'} />
                          {p.stop_loss   && <MiniStat label="SL" value={fmt(p.stop_loss)}   color="#c0392b" />}
                          {p.take_profit && <MiniStat label="TP" value={fmt(p.take_profit)} color="#E85D04" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Positions tab */}
      {tab === 'Positions' && (
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 18, marginTop: 0 }}>All Positions</h3>
          {positions.length === 0 ? <div style={{ color: '#bbb', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No open positions.</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>
                  {['Symbol', 'Name', 'Qty', 'Avg Price', 'LTP', 'Invested', 'Current Value', 'P&L', 'P&L %', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', borderBottom: '1px solid #f0ede8' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {positions.map((p, i) => {
                    const cur      = p.current_price || p.avg_price;
                    const invested = p.avg_price * p.quantity;
                    const curVal   = cur * p.quantity;
                    const pnl      = curVal - invested;
                    const pnlPct   = invested > 0 ? (pnl / invested) * 100 : 0;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fdfcfb' : '#fff' }}>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', fontWeight: 700, color: '#E85D04' }}>{p.symbol}</td>
                        <td style={{ padding: '11px 12px', color: '#777', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#555' }}>{fmtQty(p.quantity)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#555' }}>{fmt(p.avg_price)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#111' }}>{fmt(cur)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#555' }}>{fmt(invested)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#111' }}>{fmt(curVal)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', fontWeight: 700, color: pnl >= 0 ? '#9A3412' : '#7f1d1d' }}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: pnlPct >= 0 ? '#9A3412' : '#7f1d1d' }}>{fmtPct(pnlPct)}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <button onClick={() => { setExitPosition(p); setExitQty(String(p.quantity)); setExitMsg(null); setTab('Trade'); }}
                            style={{ background: '#fff0f0', border: '1px solid #fecaca', color: '#c0392b', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Exit</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'History' && (
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 18, marginTop: 0 }}>Trade History ({trades.length})</h3>
          {trades.length === 0 ? <div style={{ color: '#bbb', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No trades yet.</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>
                  {['Time', 'Symbol', 'Side', 'Qty', 'Price', 'Value', 'Commission', 'P&L'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', borderBottom: '1px solid #f0ede8' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...trades].reverse().map((t, i) => {
                    const val = (t.price || 0) * (t.quantity || 0);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fdfcfb' : '#fff' }}>
                        <td style={{ padding: '11px 12px', color: '#bbb', fontSize: 12 }}>{t.timestamp ? new Date(t.timestamp).toLocaleString('en-IN') : '—'}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', fontWeight: 700, color: '#E85D04' }}>{t.symbol}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ background: t.side === 'buy' ? '#fff7f0' : '#fff0f0', color: t.side === 'buy' ? '#9A3412' : '#7f1d1d', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {(t.side || '').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#555' }}>{fmtQty(t.quantity)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#555' }}>{fmt(t.price)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#555' }}>{fmt(val)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', color: '#E85D04' }}>{fmt(t.commission || val * 0.0005)}</td>
                        <td style={{ padding: '11px 12px', fontFamily: 'Courier New, monospace', fontWeight: 700, color: (t.pnl || 0) >= 0 ? '#9A3412' : '#7f1d1d' }}>
                          {t.pnl != null ? ((t.pnl >= 0 ? '+' : '') + fmt(t.pnl)) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === 'Analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Win Rate',       value: winRate != null ? winRate + '%' : '—', sub: `${winTrades} wins / ${closedTrades} closed` },
              { label: 'Unrealized P&L', value: fmt(Math.abs(unrealizedPnL)), color: unrealizedPnL >= 0 ? '#9A3412' : '#7f1d1d', sub: fmtPct(totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : null) },
              { label: 'Realized P&L',   value: fmt(Math.abs(realizedPnL)),   color: realizedPnL   >= 0 ? '#9A3412' : '#7f1d1d', sub: 'From closed trades' },
              { label: 'Total P&L',      value: fmt(Math.abs(unrealizedPnL + realizedPnL)), color: unrealizedPnL + realizedPnL >= 0 ? '#9A3412' : '#7f1d1d', sub: 'Combined' },
              { label: 'Open Positions', value: positions.length, sub: 'Active' },
              { label: 'Total Trades',   value: trades.length,   sub: 'All time' },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 22, fontWeight: 700, color: s.color || '#111' }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16, marginTop: 0 }}>Portfolio Allocation</h3>
            {positions.length === 0 ? <div style={{ color: '#bbb', textAlign: 'center', padding: '28px 0', fontSize: 13 }}>No positions.</div> : positions.map((p, i) => {
              const val = (p.current_price || p.avg_price) * p.quantity;
              const pct = totalCurrent > 0 ? (val / totalCurrent) * 100 : 0;
              const colors = ['#E85D04', '#c0392b', '#d97706', '#9A3412', '#7f1d1d', '#b45309'];
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: '#111', fontWeight: 600, fontSize: 13 }}>{p.symbol}</span>
                    <span style={{ fontFamily: 'Courier New, monospace', color: '#777', fontSize: 12 }}>{fmt(val)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ background: '#f7f4f0', borderRadius: 4, height: 7 }}>
                    <div style={{ background: colors[i % colors.length], width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
