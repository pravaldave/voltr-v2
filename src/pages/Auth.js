import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#fafaf8', border: '1px solid #f0ede8',
  borderRadius: 9, color: '#111',
  padding: '12px 14px', fontSize: 14,
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.18s',
  marginBottom: 12,
};

export default function Auth() {
  const [mode, setMode]       = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#fafaf8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={16} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', color: '#111' }}>voltr</span>
          </div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Financial Intelligence Platform</div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '1px solid #f0ede8',
          borderRadius: 16, padding: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 28, background: '#fafaf8', borderRadius: 9, padding: 3 }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '9px 0', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: mode === m ? 700 : 400, cursor: 'pointer',
                  background: mode === m ? '#111' : 'transparent',
                  color: mode === m ? '#fff' : '#aaa',
                  transition: 'all 0.15s',
                }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button onClick={handleGoogle} style={{
            width: '100%', padding: '12px 0', border: '1px solid #f0ede8',
            borderRadius: 9, background: '#fff', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 20, transition: 'border-color 0.18s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#f0ede8'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.87v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.53c-.16-.48-.25-.99-.25-1.53s.09-1.05.25-1.53V5.4H1.87A8 8 0 000 9c0 1.29.31 2.51.87 3.6l2.64-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.87 5.4L4.51 7.47c.63-1.89 2.39-3.89 4.47-3.89z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#f0ede8' }} />
            <span style={{ fontSize: 12, color: '#bbb' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#f0ede8' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>
              Email
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={inp}
              onFocus={e => e.target.style.borderColor = '#111'}
              onBlur={e => e.target.style.borderColor = '#f0ede8'}
            />

            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>
              Password
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" required style={{ ...inp, marginBottom: 20 }}
              onFocus={e => e.target.style.borderColor = '#111'}
              onBlur={e => e.target.style.borderColor = '#f0ede8'}
            />

            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #fecaca', color: '#c0392b', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 16 }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0',
              background: '#111', border: 'none', color: '#fff',
              borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'background 0.18s',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E85D04'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#111'}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#bbb' }}>
          By continuing you agree to Voltr's terms. For educational purposes only.
        </div>
      </div>
    </div>
  );
}