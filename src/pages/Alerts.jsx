import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const CONDITION_OPTIONS = ['--', 'above', 'below', 'crosses above', 'crosses below'];
const RSI_OPTIONS       = ['--', 'above 70 (overbought)', 'below 30 (oversold)', 'above 50 (bullish)', 'below 50 (bearish)'];
const USER_ID           = 'praval-default';

const card = { background: '#ffffff', border: '1px solid #f0ede8', borderRadius: 14 };
const inp  = {
  width: '100%', boxSizing: 'border-box',
  background: '#fafaf8', border: '1px solid #f0ede8',
  borderRadius: 9, color: '#111',
  padding: '10px 14px', fontSize: 13,
  marginBottom: 14, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.18s',
};
const lbl = { display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 };

function StatusBadge({ active }) {
  return (
    <span style={{
      background: active ? '#fff7f0' : '#f7f4f0',
      border: `1px solid ${active ? '#fdd5a8' : '#f0ede8'}`,
      color: active ? '#9A3412' : '#bbb',
      padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
    }}>
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

function ConditionChip({ icon, color, text }) {
  return (
    <div style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 6, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <span style={{ color, fontWeight: 700 }}>{icon}</span>
      <span style={{ color: '#777' }}>{text}</span>
    </div>
  );
}

export default function Alerts() {
  const [alerts,       setAlerts]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [suggestions,  setSuggestions]  = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [form, setForm] = useState({ email: '', price_condition: '--', price_value: '', rsi_condition: '--', volume_condition: '--', note: '' });
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const suppressSearch = React.useRef(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/alerts/${USER_ID}`);
      setAlerts(res.data?.alerts || []);
    } catch { setAlerts([]); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      if (suppressSearch.current) { suppressSearch.current = false; return; }
      try {
        const res = await axios.get(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data?.results || []);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectAsset = s => {
    suppressSearch.current = true;
    setSelectedAsset(s);
    setSearchQuery(s.display || s.value);
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!selectedAsset)   { setSaveMsg({ type: 'error', text: 'Please select an asset.' }); return; }
    if (!form.email)      { setSaveMsg({ type: 'error', text: 'Please enter your email.' }); return; }
    if (form.price_condition === '--' && form.rsi_condition === '--') {
      setSaveMsg({ type: 'error', text: 'Set at least one condition (price or RSI).' }); return;
    }
    setSaving(true); setSaveMsg(null);
    try {
      await axios.post(`${API_BASE}/alerts`, {
        user_id: USER_ID, asset_name: selectedAsset.value,
        recipient_email: form.email,
        price_condition: form.price_condition, price_value: parseFloat(form.price_value) || 0,
        rsi_condition: form.rsi_condition, volume_condition: form.volume_condition,
        note: form.note, is_active: true,
      });
      setSaveMsg({ type: 'success', text: 'Alert created! You\'ll be notified by email.' });
      setShowForm(false);
      setSelectedAsset(null); setSearchQuery('');
      setForm({ email: '', price_condition: '--', price_value: '', rsi_condition: '--', volume_condition: '--', note: '' });
      fetchAlerts();
    } catch (e) { setSaveMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to create alert.' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    setDeletingId(id);
    try { await axios.delete(`${API_BASE}/alerts/${id}`); fetchAlerts(); } catch {} finally { setDeletingId(null); }
  };

  const handleToggle = async alert => {
    try { await axios.patch(`${API_BASE}/alerts/${alert.id}`, { is_active: !alert.is_active }); fetchAlerts(); } catch {}
  };

  const activeCount = alerts.filter(a => a.is_active).length;
  const msgStyle    = ok => ({
    background: ok ? '#fff7f0' : '#fff0f0',
    border: `1px solid ${ok ? '#fdd5a8' : '#fecaca'}`,
    color: ok ? '#9A3412' : '#7f1d1d',
    padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 16,
  });

  return (
    <div style={{ padding: '40px 40px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 3, height: 18, background: '#111', borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px' }}>Notifications · 05</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', marginBottom: 4 }}>Smart Alerts</h1>
          <p style={{ fontSize: 13, color: '#aaa' }}>Get notified by email when your conditions are met · Checks every 60 seconds</p>
        </div>
        <button onClick={() => { setShowForm(true); setSaveMsg(null); }} style={{
          background: '#111', border: 'none', color: '#fff',
          padding: '10px 18px', borderRadius: 9, cursor: 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'background 0.18s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
          onMouseLeave={e => e.currentTarget.style.background = '#111'}
        >
          + New Alert
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Alerts', value: alerts.length, color: '#111' },
          { label: 'Active',       value: activeCount,   color: '#9A3412' },
          { label: 'Paused',       value: alerts.length - activeCount, color: '#bbb' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {saveMsg && !showForm && <div style={msgStyle(saveMsg.type === 'success')}>{saveMsg.text}</div>}

      {/* New alert form */}
      {showForm && (
        <div style={{ ...card, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>Create Alert</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>

          <label style={lbl}>Asset</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input style={{ ...inp, marginBottom: 0 }} placeholder="Search Reliance, Bitcoin, Gold, USD/INR…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSelectedAsset(null); }}
              onFocus={e => e.target.style.borderColor = '#111'}
              onBlur={e  => e.target.style.borderColor = '#f0ede8'}
            />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #f0ede8', borderRadius: 9, zIndex: 100, maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                {suggestions.slice(0, 8).map((s, i) => (
                  <div key={i} onClick={() => selectAsset(s)} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #fafaf8', display: 'flex', justifyContent: 'space-between' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontWeight: 600, color: '#111' }}>{s.display}</span>
                    <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#bbb' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label style={lbl}>Notify Email</label>
          <input style={inp} type="email" placeholder="your@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onFocus={e => e.target.style.borderColor = '#111'}
            onBlur={e  => e.target.style.borderColor = '#f0ede8'}
          />

          {/* Conditions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
            {/* Price */}
            <div style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ color: '#E85D04', fontWeight: 700 }}>₹</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Price Alert</span>
              </div>
              <label style={lbl}>Condition</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.price_condition}
                onChange={e => setForm(f => ({ ...f, price_condition: e.target.value }))}>
                {CONDITION_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              {form.price_condition !== '--' && (
                <>
                  <label style={lbl}>Price value</label>
                  <input style={inp} type="number" placeholder="e.g. 2500"
                    value={form.price_value} onChange={e => setForm(f => ({ ...f, price_value: e.target.value }))} />
                </>
              )}
            </div>

            {/* RSI */}
            <div style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ color: '#555', fontWeight: 700 }}>~</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>RSI Alert</span>
              </div>
              <label style={lbl}>Condition</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.rsi_condition}
                onChange={e => setForm(f => ({ ...f, rsi_condition: e.target.value }))}>
                {RSI_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Volume */}
            <div style={{ background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ color: '#777', fontWeight: 700 }}>↑</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Volume Alert</span>
              </div>
              <label style={lbl}>Condition</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.volume_condition}
                onChange={e => setForm(f => ({ ...f, volume_condition: e.target.value }))}>
                {['--', 'spike (2x avg)', 'spike (3x avg)', 'unusual activity'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <label style={lbl}>Note (optional)</label>
          <input style={inp} placeholder="e.g. Breakout setup, support level…"
            value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />

          {saveMsg && <div style={msgStyle(saveMsg.type === 'success')}>{saveMsg.text}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px 0', background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 9, fontSize: 13, color: '#777', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px 0', background: '#111', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: saving ? 0.6 : 1, transition: 'background 0.18s' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#E85D04'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#111'}
            >
              {saving ? 'Creating…' : 'Create Alert'}
            </button>
          </div>
        </div>
      )}

      {/* Alert list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <div style={{ width: 28, height: 28, border: '3px solid #f0ede8', borderTopColor: '#E85D04', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#bbb', marginTop: 12, fontSize: 13 }}>Loading alerts…</p>
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <h3 style={{ color: '#111', fontWeight: 800, marginBottom: 8 }}>No alerts yet</h3>
          <p style={{ color: '#aaa', fontSize: 14, marginBottom: 24 }}>Create your first alert to get notified when market conditions are met.</p>
          <button onClick={() => setShowForm(true)} style={{ background: '#111', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>+ Create First Alert</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {alerts.map((a, i) => (
            <div key={a.id || i} style={{ ...card, padding: 20, opacity: a.is_active ? 1 : 0.65, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fafaf8', border: '1px solid #f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#E85D04', fontSize: 16 }}>
                    {(a.asset_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: 15 }}>{a.asset_name}</div>
                    <div style={{ color: '#bbb', fontSize: 12 }}>{a.recipient_email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge active={a.is_active} />
                  <button onClick={() => handleToggle(a)} title={a.is_active ? 'Pause' : 'Resume'}
                    style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#111'}
                    onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
                  >
                    {a.is_active ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} title="Delete"
                    style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                    onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
                  >
                    {deletingId === a.id ? '…' : '✕'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {a.price_condition && a.price_condition !== '--' && (() => {
                  const isINR = a.asset_name?.includes('.NS') || a.asset_name?.includes('.BO');
                  const sym   = isINR ? '₹' : '$';
                  return <ConditionChip icon={sym} color="#E85D04" text={`Price ${a.price_condition} ${sym}${Number(a.price_value).toLocaleString('en-IN')}`} />;
                })()}
                {a.rsi_condition && a.rsi_condition !== '--' && <ConditionChip icon="~" color="#555" text={`RSI ${a.rsi_condition}`} />}
                {a.volume_condition && a.volume_condition !== '--' && <ConditionChip icon="↑" color="#777" text={`Volume ${a.volume_condition}`} />}
              </div>

              {a.note && <div style={{ marginTop: 10, color: '#aaa', fontSize: 12, fontStyle: 'italic' }}>"{a.note}"</div>}
              <div style={{ marginTop: 10, color: '#ccc', fontSize: 11 }}>
                Created {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'recently'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
