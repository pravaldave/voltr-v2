import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { API_BASE, USER_ID } from '../config';

const card = { background: '#ffffff', border: '1px solid #f0ede8', borderRadius: 14 };

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#fafaf8', border: '1px solid #f0ede8',
  borderRadius: 9, color: '#111',
  padding: '10px 14px', fontSize: 13,
  outline: 'none', fontFamily: 'inherit',
};

export default function Portfolio() {
  const [holdings, setHoldings]         = useState([]);
  const [prices, setPrices]             = useState({});
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [quantity, setQuantity]         = useState('');
  const [buyPrice, setBuyPrice]         = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [reportEmail, setReportEmail]   = useState('');
  const [reportModal, setReportModal]   = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const searchRef = useRef(null);

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`${API_BASE}/portfolio/${USER_ID}`);
      if (res.data.holdings) {
        setHoldings(res.data.holdings);
        res.data.holdings.forEach(h => {
          const id = h.ticker || h.name;
          axios.get(`${API_BASE}/price?name=${encodeURIComponent(id)}`)
            .then(p => setPrices(prev => ({ ...prev, [h.name]: p.data })))
            .catch(() => {});
        });
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    if (selectedAsset && searchQuery === selectedAsset.display) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
        const raw = res.data.results || [];
        setSearchResults(raw.map(r => typeof r === 'string' ? { display: r, value: r } : r));
        setShowDropdown(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedAsset]);

  const handleSelectAsset = asset => {
    setSelectedAsset(asset);
    setSearchQuery(asset.display);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleAddHolding = async e => {
    e.preventDefault();
    if (!selectedAsset || !quantity || !buyPrice) return;
    try {
      const res = await axios.post(`${API_BASE}/portfolio`, {
        user_id: USER_ID, name: selectedAsset.display,
        asset_type: 'stock', ticker: selectedAsset.value,
        quantity: parseFloat(quantity), buy_price: parseFloat(buyPrice), currency: 'INR',
      });
      if (res.data.success) {
        await fetchPortfolio();
        setIsModalOpen(false);
        setSearchQuery(''); setSelectedAsset(null);
        setQuantity(''); setBuyPrice('');
      }
    } catch {}
  };

  const handleDelete = async id => {
    try {
      await axios.delete(`${API_BASE}/portfolio/${id}`);
      setHoldings(holdings.filter(h => h.id !== id));
    } catch {}
  };

  const sendReport = async () => {
    if (!reportEmail) return;
    setReportSending(true);
    try {
      const res = await axios.post(`${API_BASE}/portfolio/report`, {
        user_id: USER_ID, email: reportEmail, period: 'Weekly',
      });
      if (res.data.success) { alert(`Report sent to ${reportEmail}`); setReportModal(false); }
      else alert('Failed to send report');
    } catch { alert('Failed to send report'); }
    setReportSending(false);
  };

  const totalCost  = holdings.reduce((s, h) => s + h.buy_price * h.quantity, 0);
  const totalValue = holdings.reduce((s, h) => s + (prices[h.name]?.price ?? h.buy_price) * h.quantity, 0);
  const totalPnl   = totalValue - totalCost;
  const totalPct   = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const todayPnl   = holdings.reduce((s, h) => {
    const ch = prices[h.name]?.change ?? 0;
    const cp = prices[h.name]?.price  ?? h.buy_price;
    return s + cp * h.quantity * ch / 100;
  }, 0);

  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6, display: 'block' };
  const modalInp   = { ...inp, marginBottom: 14 };

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 3, height: 18, background: '#111', borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px' }}>
              Holdings · 02
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', marginBottom: 4 }}>Portfolio</h1>
          <p style={{ fontSize: 13, color: '#aaa' }}>Manage your holdings and track performance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setReportModal(true)} style={{
            background: 'transparent', border: '1px solid #f0ede8',
            color: '#777', borderRadius: 9, padding: '10px 18px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0ede8'; e.currentTarget.style.color = '#777'; }}
          >
            Email Report
          </button>
          <button onClick={() => setIsModalOpen(true)} style={{
            background: '#111', border: 'none', color: '#fff',
            borderRadius: 9, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.18s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
            onMouseLeave={e => e.currentTarget.style.background = '#111'}
          >
            + Add Holding
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {holdings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Value',    value: `₹${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#111' },
            { label: 'Total Invested', value: `₹${totalCost.toLocaleString(undefined,  { maximumFractionDigits: 0 })}`, color: '#111' },
            { label: 'Total P&L',
              value: `${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              sub:   `${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(2)}%`,
              color: totalPnl >= 0 ? '#16a34a' : '#c0392b' },
            { label: "Today's P&L",
              value: `${todayPnl >= 0 ? '+' : ''}₹${Math.abs(todayPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              color: todayPnl >= 0 ? '#16a34a' : '#c0392b' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              {s.sub && <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: s.color, marginTop: 3 }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {holdings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#bbb', fontSize: 14 }}>
            No active positions. Click <strong style={{ color: '#111' }}>+ Add Holding</strong> to start.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0ede8' }}>
                {['Asset', 'Qty', 'Buy Price', 'Current', 'P&L', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: h === 'Asset' ? 'left' : 'right',
                    fontSize: 10, fontWeight: 700, color: '#bbb',
                    textTransform: 'uppercase', letterSpacing: '2px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => {
                const cp  = prices[h.name]?.price;
                const pnl = cp ? (cp - h.buy_price) * h.quantity : null;
                const pct = cp ? ((cp - h.buy_price) / h.buy_price) * 100 : null;
                return (
                  <tr key={h.id} style={{ borderBottom: i < holdings.length - 1 ? '1px solid #fafaf8' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fdfcfb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{h.name}</div>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#bbb', marginTop: 2 }}>{h.ticker}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'Courier New, monospace', color: '#555' }}>{h.quantity}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'Courier New, monospace', color: '#555' }}>₹{h.buy_price.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'Courier New, monospace', color: '#111' }}>
                      {cp ? `₹${cp.toLocaleString()}` : <span style={{ color: '#ccc' }}>Loading…</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {pnl != null ? (
                        <span style={{
                          fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 700,
                          color: pnl >= 0 ? '#16a34a' : '#c0392b',
                          background: pnl >= 0 ? '#f0fdf4' : '#fff0f0',
                          padding: '3px 8px', borderRadius: 5,
                        }}>
                          {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          <span style={{ fontSize: 10, marginLeft: 4 }}>({pct?.toFixed(2)}%)</span>
                        </span>
                      ) : <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(h.id)} style={{
                        background: '#fff0f0', border: '1px solid #fecaca',
                        color: '#c0392b', fontSize: 11, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Holding Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #f0ede8', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 22, marginTop: 0 }}>Add New Position</h2>
            <form onSubmit={handleAddHolding}>
              <div ref={searchRef} style={{ position: 'relative', marginBottom: 14 }}>
                <label style={labelStyle}>Asset</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search asset…"
                    style={{ ...modalInp, paddingLeft: 36, marginBottom: 0 }}
                    required />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, background: '#fff', border: '1px solid #f0ede8', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    {searchResults.map(s => (
                      <div key={s.value} onClick={() => handleSelectAsset(s)} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #fafaf8', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <span style={{ fontWeight: 500, color: '#111' }}>{s.display}</span>
                        <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#bbb' }}>{(s.value || '').split('.')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} style={modalInp} required />
                </div>
                <div>
                  <label style={labelStyle}>Buy Price (₹)</label>
                  <input type="number" step="any" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} style={modalInp} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{
                  flex: 1, padding: '11px 0', background: '#fafaf8', border: '1px solid #f0ede8',
                  borderRadius: 9, fontSize: 13, fontWeight: 500, color: '#777', cursor: 'pointer',
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '11px 0', background: '#111', border: 'none',
                  borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
                  onMouseLeave={e => e.currentTarget.style.background = '#111'}
                >Add Holding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Report Modal */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #f0ede8', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 6, marginTop: 0 }}>Email Portfolio Report</h2>
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>Full analysis with buy/sell/hold recommendations.</p>
            <input type="email" value={reportEmail} onChange={e => setReportEmail(e.target.value)}
              placeholder="your@email.com" style={{ ...modalInp }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReportModal(false)} style={{
                flex: 1, padding: '11px 0', background: '#fafaf8', border: '1px solid #f0ede8',
                borderRadius: 9, fontSize: 13, color: '#777', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={sendReport} disabled={reportSending} style={{
                flex: 1, padding: '11px 0', background: '#111', border: 'none',
                borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                opacity: reportSending ? 0.6 : 1,
              }}>
                {reportSending ? 'Sending…' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
