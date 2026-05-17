import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import Register from './Register';

const API = 'https://malawi-sales-backend.onrender.com';

const ROLE_COLORS = {
  admin: '#FF6B35',
  salesperson: '#2D6A4F',
  viewer: '#457B9D'
};

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) return <Register onBack={() => setShowRegister(false)}/>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role) => {
    const credentials = {
      admin: { email: 'admin@sabias.com', password: 'Admin@2026' },
      salesperson: { email: 'tadala@sabias.com', password: 'Sales@2026' },
      viewer: { email: 'viewer@sabias.com', password: 'View@2026' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ background: '#3E1F00', borderRadius: 16, padding: '16px 32px',
                      display: 'inline-block', marginBottom: 12 }}>
          <div style={{ color: '#FFB800', fontSize: 36, fontWeight: 'bold',
                        fontFamily: 'Arial', letterSpacing: 4 }}>SABIAS</div>
          <div style={{ color: '#FF6B35', fontSize: 11, fontFamily: 'Arial', marginTop: 4 }}>
            Sales & Business Intelligence Analytics System
          </div>
        </div>
        <div style={{ color: '#888', fontSize: 13, fontFamily: 'Arial' }}>
          Sign in to your account
        </div>
      </div>

      {/* Login Card */}
      <div style={{ background: 'white', borderRadius: 16, padding: 36,
                    width: '100%', maxWidth: 420,
                    boxShadow: '0 4px 24px rgba(62,31,0,0.10)',
                    fontFamily: 'Arial' }}>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                        color: '#C0392B', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888',
                            marginBottom: 6, fontWeight: 'bold' }}>
              EMAIL ADDRESS
            </label>
            <input type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8,
                       border: '1.5px solid #FFB800', fontSize: 14,
                       boxSizing: 'border-box', outline: 'none',
                       background: '#FFFDF8' }}/>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888',
                            marginBottom: 6, fontWeight: 'bold' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'}
                value={password} required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '12px 44px 12px 14px',
                         borderRadius: 8, border: '1.5px solid #FFB800',
                         fontSize: 14, boxSizing: 'border-box', outline: 'none',
                         background: '#FFFDF8' }}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%',
                         transform: 'translateY(-50%)', background: 'none',
                         border: 'none', cursor: 'pointer', color: '#888',
                         fontSize: 13 }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#3E1F00',
                     border: 'none', borderRadius: 8, color: '#FFB800',
                     fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                     letterSpacing: 1 }}>
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>
        </form>

        {/* Quick login */}
        <div style={{ marginTop: 28, borderTop: '1px solid #FFE8D0', paddingTop: 20 }}>
          <div style={{ fontSize: 11, color: '#AAA', textAlign: 'center',
                        marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Quick Access
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['admin', 'salesperson', 'viewer'].map(role => (
              <button key={role} onClick={() => quickLogin(role)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 6,
                         border: `1.5px solid ${ROLE_COLORS[role]}`,
                         background: 'white', color: ROLE_COLORS[role],
                         fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
                         textTransform: 'capitalize' }}>
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#888', fontSize: 13 }}>
            New business?{' '}
            <span onClick={() => setShowRegister(true)}
              style={{ color: '#FF6B35', cursor: 'pointer', fontWeight: 'bold' }}>
              Register here
            </span>
          </span>
        </div>
      </div>

      {/* Role info */}
      <div style={{ marginTop: 24, display: 'flex', gap: 16, fontFamily: 'Arial' }}>
        {[
          { role: 'Admin', desc: 'Full access', color: '#FF6B35' },
          { role: 'Salesperson', desc: 'Own records', color: '#2D6A4F' },
          { role: 'Viewer', desc: 'Read only', color: '#457B9D' },
        ].map(({ role, desc, color }) => (
          <div key={role} style={{ textAlign: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%',
                          background: color, margin: '0 auto 4px' }}/>
            <div style={{ fontSize: 11, color: '#888' }}>{role}</div>
            <div style={{ fontSize: 10, color: '#AAA' }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, color: '#BBB', fontSize: 11, fontFamily: 'Arial' }}>
        SABIAS © 2026 · Sales & Business Intelligence Analytics System
      </div>
    </div>
  );
}