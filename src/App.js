import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, TrendingUp, BookOpen, Zap, Activity } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Dashboard  from './pages/Dashboard';
import Landing    from './pages/landing';
import Auth       from './pages/Auth';
import Portfolio  from './pages/Portfolio';
import Explore    from './pages/Explore';
import PaperTrade from './pages/PaperTrade';
import Alerts     from './pages/Alerts';
import { useCurrency } from './context/CurrencyContext';
import { useAuth } from './context/AuthContext';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',   tag: '01' },
  { to: '/portfolio', icon: Briefcase,       label: 'Portfolio',   tag: '02' },
  { to: '/explore',   icon: TrendingUp,      label: 'Explore',     tag: '03' },
  { to: '/paper',     icon: BookOpen,        label: 'Paper Trade', tag: '04' },
  { to: '/alerts',    icon: Zap,             label: 'Alerts',      tag: '05' },
];

function PageWrapper({ children }) {
  const location = useLocation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, [location.pathname]);
  return (
    <div style={{
      opacity:   show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.32s ease, transform 0.32s ease',
    }}>
      {children}
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <aside style={{
      width: 220, flexShrink: 0, position: 'relative', zIndex: 10,
      background: '#ffffff',
      borderRight: '1px solid #f0ede8',
      display: 'flex', flexDirection: 'column',
      padding: '32px 16px 24px',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: '#E85D04',
      }} />

      {/* Logo */}
      <div style={{ paddingLeft: 8, marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={14} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-1px', color: '#111' }}>
            voltr
          </div>
        </div>
        <div style={{
          fontSize: 9, color: '#ccc',
          letterSpacing: '2.5px', textTransform: 'uppercase', paddingLeft: 40,
        }}>
          Financial Intelligence
        </div>
      </div>

      {/* Nav label */}
      <div style={{
        fontSize: 9, color: '#ccc',
        letterSpacing: '2.5px', textTransform: 'uppercase',
        marginBottom: 10, paddingLeft: 8,
      }}>
        Navigation
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {nav.map(({ to, icon: Icon, label, tag }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 9, fontSize: 13,
                fontWeight:  isActive ? 700 : 400,
                color:       isActive ? '#111' : '#aaa',
                background:  isActive ? '#f7f4f0' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.18s ease',
                border: `1px solid ${isActive ? '#ede9e4' : 'transparent'}`,
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color      = '#111';
                  e.currentTarget.style.background = '#fafaf8';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color      = '#aaa';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3,
                  background: '#E85D04', borderRadius: '0 2px 2px 0',
                }} />
              )}
              <Icon size={14} style={{ opacity: isActive ? 1 : 0.4 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: isActive ? '#E85D04' : '#ddd',
                letterSpacing: '0.5px',
              }}>{tag}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Live clock */}
      <div style={{
        padding: '12px 14px', marginBottom: 12,
        background: '#fafaf8', border: '1px solid #f0ede8', borderRadius: 10,
      }}>
        <div style={{ fontSize: 9, color: '#ccc', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>IST</div>
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '1px' }}>{time}</div>
        <div style={{ fontSize: 9, color: '#bbb', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* User email */}
      {user && (
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 4, paddingRight: 4 }}>
          {user.email}
        </div>
      )}

      {/* Sign out */}
      <button onClick={signOut} style={{
        width: '100%', padding: '10px 0',
        background: 'transparent', border: '1px solid #f0ede8',
        borderRadius: 9, color: '#bbb', fontSize: 12,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.18s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0ede8'; e.currentTarget.style.color = '#bbb'; }}
      >
        Sign Out
      </button>
    </aside>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fafaf8', color: '#bbb', fontFamily: 'Inter' }}>
      Loading…
    </div>
  );
  if (!user) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fafaf8', color: '#111', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{
        flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2,
        background: '#fafaf8', scrollbarWidth: 'thin', scrollbarColor: '#ede9e4 transparent',
      }}>
        <PageWrapper>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/explore"   element={<Explore />} />
            <Route path="/paper"     element={<PaperTrade />} />
            <Route path="/alerts"    element={<Alerts />} />
          </Routes>
        </PageWrapper>
      </main>
    </div>
  );
}

export default function App() {
  const { fetchRates } = useCurrency();
  useEffect(() => { fetchRates('USD'); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/*"    element={<ProtectedRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
