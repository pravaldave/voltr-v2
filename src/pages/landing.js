import { useNavigate } from 'react-router-dom';
import { TrendingUp, Bell, BookOpen, BarChart2, ArrowRight, Activity } from 'lucide-react';

const features = [
  {
    icon: BarChart2,
    title: 'Live Market Intelligence',
    desc: 'Real-time prices across Indian equities, US stocks, crypto, commodities and forex. Nifty 50, Bitcoin, Gold — all in one place.',
  },
  {
    icon: TrendingUp,
    title: 'Portfolio Tracker',
    desc: 'Track your holdings with live P&L, today\'s gains, and weekly email reports with buy/sell/hold recommendations.',
  },
  {
    icon: BookOpen,
    title: 'Paper Trading',
    desc: 'Practice with ₹10,00,000 virtual capital. Live prices, real slippage, stop-loss and take-profit orders.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Get email alerts when price, RSI or volume conditions are met. Checks every 5 seconds.',
  },
];

const stats = [
  { value: '5,000+', label: 'Assets tracked' },
  { value: '9', label: 'Sectors covered' },
  { value: '₹10L', label: 'Virtual capital' },
  { value: '5s', label: 'Alert latency' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafaf8',
      color: '#111',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: 'hidden',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid #f0ede8',
        background: '#ffffff',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-1px', color: '#111' }}>voltr</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#bbb', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            Financial Intelligence
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#111', color: '#fff', border: 'none',
              borderRadius: 9, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
            onMouseLeave={e => e.currentTarget.style.background = '#111'}
          >
            Launch App <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 900, margin: '0 auto',
        padding: '100px 48px 80px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #f0ede8',
          borderRadius: 20, padding: '6px 16px', marginBottom: 32,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E85D04' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#E85D04', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Live · Updated in real-time
          </span>
        </div>

        <h1 style={{
          fontSize: 72, fontWeight: 900, letterSpacing: '-3px',
          lineHeight: 1.05, color: '#111', marginBottom: 24,
        }}>
          Financial intelligence<br />
          <span style={{ color: '#E85D04' }}>built for India.</span>
        </h1>

        <p style={{
          fontSize: 18, color: '#777', lineHeight: 1.7,
          maxWidth: 560, margin: '0 auto 40px',
        }}>
          Track portfolios, explore markets, paper trade with live prices,
          and get instant alerts — all in one clean platform.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#111', color: '#fff', border: 'none',
              borderRadius: 10, padding: '14px 32px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
            onMouseLeave={e => e.currentTarget.style.background = '#111'}
          >
            Launch App <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/explore')}
            style={{
              background: 'transparent', color: '#777',
              border: '1px solid #f0ede8',
              borderRadius: 10, padding: '14px 32px',
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0ede8'; e.currentTarget.style.color = '#777'; }}
          >
            Explore Markets
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        maxWidth: 900, margin: '0 auto 80px',
        padding: '0 48px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid #f0ede8',
            borderRadius: 14, padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 6 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{
        maxWidth: 900, margin: '0 auto 100px',
        padding: '0 48px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 12 }}>
            What Voltr does
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', color: '#111' }}>
            Everything you need to trade smarter
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: '#fff', border: '1px solid #f0ede8',
              borderRadius: 14, padding: '28px 28px',
              transition: 'border-color 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#E85D04'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#f0ede8'}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#fafaf8', border: '1px solid #f0ede8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={18} color="#E85D04" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#777', lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: '#111', padding: '80px 48px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#E85D04', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 20 }}>
          Free · No sign-up required
        </div>
        <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', color: '#fff', marginBottom: 16 }}>
          Start trading smarter today.
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 36 }}>
          No account needed. Just open the app and start exploring.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#E85D04', color: '#fff', border: 'none',
            borderRadius: 10, padding: '16px 40px',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'opacity 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Launch Voltr <ArrowRight size={16} />
        </button>
      </div>

      {/* Footer */}
      <div style={{
        background: '#111', borderTop: '1px solid #1a1a1a',
        padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#E85D04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={11} color="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>voltr</span>
        </div>
        <span style={{ fontSize: 12, color: '#444' }}>
          Built with FastAPI · React · Supabase · yfinance
        </span>
        <span style={{ fontSize: 12, color: '#444' }}>
          For educational purposes only · Not financial advice
        </span>
      </div>
    </div>
  );
}
