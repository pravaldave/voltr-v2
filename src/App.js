import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, TrendingUp, BookOpen, Zap, Activity } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Dashboard  from './pages/Dashboard';
import Portfolio  from './pages/Portfolio';
import Explore    from './pages/Explore';
import PaperTrade from './pages/PaperTrade';
import Alerts     from './pages/Alerts';
import { useCurrency, CURRENCIES } from './context/CurrencyContext';

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',   tag: '01' },
  { to: '/portfolio', icon: Briefcase,       label: 'Portfolio',   tag: '02' },
  { to: '/explore',   icon: TrendingUp,      label: 'Explore',     tag: '03' },
  { to: '/paper',     icon: BookOpen,        label: 'Paper Trade', tag: '04' },
  { to: '/alerts',    icon: Zap,             label: 'Alerts',      tag: '05' },
];

// Bull & Bear background canvas — always present, always subtle
function BullBearCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, raf;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();

    let t = 0;

    function drawBull(x, y, scale, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#E85D04';
      ctx.lineWidth   = 2.2;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      // Body
      ctx.beginPath(); ctx.ellipse(0, 0, 38, 22, 0, 0, Math.PI * 2); ctx.stroke();
      // Head
      ctx.beginPath(); ctx.ellipse(34, -14, 16, 13, -0.3, 0, Math.PI * 2); ctx.stroke();
      // Horns
      ctx.beginPath();
      ctx.moveTo(22, -22); ctx.bezierCurveTo(26, -38, 14, -42, 18, -30); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(32, -24); ctx.bezierCurveTo(40, -38, 28, -44, 30, -30); ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(-24, 10); ctx.lineTo(-28, 34);
      ctx.moveTo(-10, 14); ctx.lineTo(-12, 38);
      ctx.moveTo( 10, 12); ctx.lineTo( 10, 36);
      ctx.moveTo( 24,  8); ctx.lineTo( 26, 32);
      ctx.stroke();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-38, 0); ctx.bezierCurveTo(-50, -6, -54, 4, -44, 8); ctx.stroke();
      ctx.restore();
    }

    function drawBear(x, y, scale, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(-scale, scale); // flipped to face left
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth   = 2.2;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      // Body
      ctx.beginPath(); ctx.ellipse(0, 0, 36, 26, 0, 0, Math.PI * 2); ctx.stroke();
      // Head
      ctx.beginPath(); ctx.ellipse(30, -18, 18, 15, 0.2, 0, Math.PI * 2); ctx.stroke();
      // Ears
      ctx.beginPath(); ctx.arc(18, -30, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(34, -30, 7, 0, Math.PI * 2); ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(-20, 14); ctx.lineTo(-22, 40);
      ctx.moveTo( -6, 18); ctx.lineTo( -6, 42);
      ctx.moveTo( 10, 16); ctx.lineTo( 12, 40);
      ctx.moveTo( 24, 10); ctx.lineTo( 28, 34);
      ctx.stroke();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-36, -2); ctx.bezierCurveTo(-52, -14, -56, 6, -42, 10); ctx.stroke();
      ctx.restore();
    }

    function drawClash(cx, cy, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 0.6;
        const len   = 10 + Math.sin(t * 3 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 7,       cy + Math.sin(angle) * 7);
        ctx.lineTo(cx + Math.cos(angle) * (7 + len), cy + Math.sin(angle) * (7 + len));
        ctx.strokeStyle = i % 2 === 0 ? '#E85D04' : '#c0392b';
        ctx.lineWidth   = 1.4;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;

      const push    = Math.sin(t) * 18;
      const breathe = Math.sin(t * 1.5) * 0.03;
      const bullX   = W * 0.30 + push;
      const bearX   = W * 0.70 - push;
      const midX    = (bullX + bearX) / 2;

      drawBull(bullX, H * 0.55, 0.80 + breathe, 0.045);
      drawBear(bearX, H * 0.55, 0.80 - breathe, 0.045);
      drawClash(midX, H * 0.46, 0.035 + Math.abs(Math.sin(t)) * 0.02);

      raf = requestAnimationFrame(draw);
    }
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        opacity: 0.5,
      }}
    />
  );
}

// Subtle dot-grid texture
function DotGrid() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(circle, #d4cfc8 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      opacity: 0.35,
    }} />
  );
}

// Page transition
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
      opacity:    show ? 1 : 0,
      transform:  show ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.32s ease, transform 0.32s ease',
    }}>
      {children}
    </div>
  );
}

function Sidebar({ currency, setCurrency }) {
  const location = useLocation();
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

      {/* Orange top accent line */}
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
          <div style={{
            fontSize: 20, fontWeight: 900, letterSpacing: '-1px', color: '#111',
          }}>
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
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} end={to === '/'}
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
              {/* Active left border */}
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
              }}>
                {tag}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Live clock */}
      <div style={{
        padding: '12px 14px', marginBottom: 16,
        background: '#fafaf8',
        border: '1px solid #f0ede8',
        borderRadius: 10,
      }}>
        <div style={{
          fontSize: 9, color: '#ccc',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5,
        }}>
          IST
        </div>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '1px',
        }}>
          {time}
        </div>
        <div style={{ fontSize: 9, color: '#bbb', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short',
          })}
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const { currency, setCurrency, fetchRates } = useCurrency();
  useEffect(() => { fetchRates('USD'); }, []);

  return (
    <BrowserRouter>
      <div style={{
        display: 'flex', height: '100vh', overflow: 'hidden',
        background: '#fafaf8',
        color: '#111',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
      }}>


        {/* App layout */}
        <AppWithRouter currency={currency} setCurrency={setCurrency} />
      </div>
    </BrowserRouter>
  );
}

function AppWithRouter({ currency, setCurrency }) {
  return (
    <>
      <Sidebar currency={currency} setCurrency={setCurrency} />
      <main style={{
        flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2,
        background: '#fafaf8',
        scrollbarWidth: 'thin',
        scrollbarColor: '#ede9e4 transparent',
      }}>
        <PageWrapper>
          <Routes>
            <Route path="/"          element={<Dashboard />}  />
            <Route path="/portfolio" element={<Portfolio />}  />
            <Route path="/explore"   element={<Explore />}    />
            <Route path="/paper"     element={<PaperTrade />} />
            <Route path="/alerts"    element={<Alerts />}     />
          </Routes>
        </PageWrapper>
      </main>
    </>
  );
}
