import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { API_BASE } from '../config';

const card = {
  background: '#ffffff',
  border: '1px solid #f0ede8',
  borderRadius: 14,
};

function StatCard({ label, value, change, currency, loading }) {
  const up  = (change || 0) >= 0;
  const sym = currency === 'INR' ? '₹' : '$';
  return (
    <div
      style={{ ...card, padding: '20px 22px', cursor: 'default', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#E85D04'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#f0ede8'}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>
        {label}
      </div>
      {loading ? (
        <div>
          <div style={{ height: 26, width: '65%', background: '#f7f4f0', borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 12, width: '35%', background: '#f7f4f0', borderRadius: 4 }} />
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-0.5px', marginBottom: 8 }}>
            {sym}{value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: up ? '#fff7f0' : '#fff0f0',
          }}>
            {up
              ? <TrendingUp size={11} color="#E85D04" />
              : <TrendingDown size={11} color="#c0392b" />}
            <span style={{ fontSize: 11, fontWeight: 700, color: up ? '#E85D04' : '#c0392b' }}>
              {up ? '+' : ''}{change?.toFixed(2)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function RegimeCard({ regime }) {
  if (!regime) return (
    <div style={{ ...card, padding: 28, minHeight: 200 }}>
      <div style={{ height: 16, width: '40%', background: '#f7f4f0', borderRadius: 4, marginBottom: 20 }} />
      <div style={{ height: 40, width: '60%', background: '#f7f4f0', borderRadius: 6 }} />
    </div>
  );

  const colorMap = { Bull: '#E85D04', Bear: '#c0392b', Sideways: '#d97706', Unknown: '#aaa' };
  const color    = colorMap[regime.regime] || '#aaa';

  return (
    <div style={{ ...card, padding: 28, position: 'relative', overflow: 'hidden' }}>
      {/* Faint tinted corner */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
        borderRadius: '50%', background: color, opacity: 0.05, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Market Regime
        </span>
      </div>

      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 40, fontWeight: 900, color, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6 }}>
        {regime.regime}
      </div>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 18, fontWeight: 500 }}>
        {regime.confidence}% confidence
      </div>
      <p style={{ fontSize: 13, color: '#777', lineHeight: 1.65, marginBottom: 22, maxWidth: 300 }}>
        {regime.description}
      </p>

      <div style={{ display: 'flex', gap: 28, paddingTop: 18, borderTop: '1px solid #f0ede8' }}>
        {[
          { label: 'Volatility', value: `${regime.volatility}%`, col: '#777' },
          { label: 'Trend',      value: `${regime.trend > 0 ? '+' : ''}${regime.trend}%`, col: regime.trend >= 0 ? '#E85D04' : '#c0392b' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 18, fontWeight: 700, color: s.col }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorCard({ sectors }) {
  const [view, setView] = useState('1d');

  if (!sectors || Object.keys(sectors).length === 0) return (
    <div style={{ ...card, padding: 28, minHeight: 200 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 20 }}>
        Sector Heatmap
      </div>
      <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading sectors…</div>
    </div>
  );

  return (
    <div style={{ ...card, padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={12} color="#E85D04" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Sector Heatmap
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3, background: '#f7f4f0', borderRadius: 8, padding: 3 }}>
          {['1d', '1w', '1mo'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11, border: 'none', cursor: 'pointer',
              fontWeight: view === v ? 700 : 400,
              background: view === v ? '#111' : 'transparent',
              color:      view === v ? '#fff' : '#aaa',
              transition: 'all 0.15s',
            }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(sectors).map(([sector, data]) => {
          const val       = data[view] ?? 0;
          const up        = val >= 0;
          const intensity = Math.min(Math.abs(val) / 4, 1);
          return (
            <div key={sector} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px', borderRadius: 10,
              background: up
                ? `rgba(232,93,4,${0.04 + intensity * 0.09})`
                : `rgba(192,57,43,${0.04 + intensity * 0.09})`,
              border: `1px solid ${up ? 'rgba(232,93,4,0.15)' : 'rgba(192,57,43,0.15)'}`,
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{sector}</span>
              <span style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 700, color: up ? '#9A3412' : '#7f1d1d' }}>
                {up ? '+' : ''}{val.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [regime,  setRegime]  = useState(null);
  const [sectors, setSectors] = useState(null);
  const [prices,  setPrices]  = useState({});

  // Indian assets show ₹, rest show $
  const watchlist = [
    { name: 'Nifty 50',        label: 'Nifty 50',  forceCurrency: 'INR' },
    { name: 'Bitcoin',         label: 'Bitcoin',   forceCurrency: 'USD' },
    { name: 'Gold',            label: 'Gold',      forceCurrency: 'USD' },
    { name: 'USD/INR (Forex)', label: 'USD/INR',   forceCurrency: 'USD' },
  ];

  useEffect(() => {
    axios.get(`${API_BASE}/regime`).then(r => setRegime(r.data)).catch(() => {});
    axios.get(`${API_BASE}/sectors`).then(r => setSectors(r.data)).catch(() => {});
    watchlist.forEach(({ name }) => {
      axios.get(`${API_BASE}/price`, { params: { name } })
        .then(r => setPrices(p => ({ ...p, [name]: r.data })))
        .catch(() => {});
    });
  }, []);

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1200 }}>

      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 18, background: '#111', borderRadius: 2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px' }}>
            Market Overview · 01
          </span>
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', marginBottom: 6 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#aaa' }}>Real-time market intelligence · Updated live</p>
      </div>

      {/* Watchlist stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {watchlist.map(({ name, label, forceCurrency }) => (
          <StatCard
            key={name}
            label={label}
            value={prices[name]?.price}
            change={prices[name]?.change ?? 0}
            currency={forceCurrency}
            loading={!prices[name]}
          />
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.55fr', gap: 14 }}>
        <RegimeCard regime={regime} />
        <SectorCard sectors={sectors} />
      </div>
    </div>
  );
}
