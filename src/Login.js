import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import Register from './Register';

const API = 'https://api.sabiasanalytics.com';

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotRole, setForgotRole] = useState('');
  const [pressedRole, setPressedRole] = useState(null);

  // ── ROLE BUTTON PRESS STATE ───────────────────────────
  const [pressedRole, setPressedRole] = useState(null);

  const handleRolePress = (role) => {
    setPressedRole(role);
    setTimeout(() => setPressedRole(null), 220);
  };

  // ── PWA INSTALL PROMPT ────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset');
  const [showReset, setShowReset] = useState(!!resetToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

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

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMsg('');
    setForgotRole('');
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotMsg(res.data.message);
    } catch (err) {
      const role = err.response?.data?.role;
      if (role && role !== 'admin') {
        setForgotRole(role);
      } else {
        setForgotError(err.response?.data?.error || 'Failed to send reset email. Try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match!'); return; }
    if (newPassword.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token: resetToken, password: newPassword });
      setResetDone(true);
      window.history.replaceState({}, document.title, '/');
    } catch (err) {
      setResetError(err.response?.data?.error || 'Reset failed. Please request a new link.');
    } finally {
      setResetLoading(false);
    }
  };

  // ── INSTALL BANNER ────────────────────────────────────
  const InstallBanner = () => {
    if (!showInstallBanner) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#3E1F00', padding: '12px 16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#FFB800', color: '#3E1F00', fontWeight: 'bold',
            fontSize: 14, padding: '4px 10px', borderRadius: 6, letterSpacing: 2 }}>
            SABIAS
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>
              Install SABIAS App
            </div>
            <div style={{ color: '#FFB800', fontSize: 11 }}>
              Add to your home screen for quick access
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleInstall}
            style={{ background: '#FF6B35', border: 'none', color: 'white',
              padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial' }}>
            Install
          </button>
          <button onClick={() => setShowInstallBanner(false)}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', padding: '8px 12px', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontFamily: 'Arial' }}>
            Not now
          </button>
        </div>
      </div>
    );
  };

  // ── ROLE BUTTONS WITH PRESS ANIMATION ─────────────────
  const RoleButtons = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {[
        { role: 'Admin',       color: '#FF6B35', desc: 'Full access to all features' },
        { role: 'Salesperson', color: '#2D6A4F', desc: 'Record and view own sales' },
        { role: 'Viewer',      color: '#457B9D', desc: 'Read-only analytics access' },
      ].map(({ role, color, desc }) => {
        const pressed = pressedRole === role;
        return (
          <div key={role}
            onClick={() => handleRolePress(role)}
            title={desc}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: 8,
              border: `1.5px solid ${color}`,
              background: pressed ? color : 'white',
              color: pressed ? 'white' : color,
              fontSize: 11, fontWeight: 'bold',
              textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.15s ease',
              transform: pressed ? 'scale(0.93)' : 'scale(1)',
              boxShadow: pressed ? `0 2px 8px ${color}55` : 'none',
              userSelect: 'none',
            }}>
            {role}
          </div>
        );
      })}
    </div>
  );

  // ── SIGN UP BUTTON ─────────────────────────────────────
  const [pressedSignUp, setPressedSignUp] = useState(false);

  // ── RESET SCREEN ──────────────────────────────────────
  if (showReset) return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', boxSizing: 'border-box', fontFamily: 'Arial' }}>
      <InstallBanner/>
      <div style={{ textAlign: 'center', marginBottom: 28, width: '100%', maxWidth: 420 }}>
        <div style={{ background: '#3E1F00', borderRadius: 16, padding: '16px 24px',
          display: 'block', marginBottom: 12 }}>
          <div style={{ color: '#FFB800', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>SABIAS</div>
          <div style={{ color: '#FF6B35', fontSize: 11, marginTop: 4 }}>
            Sales & Business Intelligence Analytics System
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px',
        width: '100%', maxWidth: 420, boxSizing: 'border-box',
        boxShadow: '0 4px 24px rgba(62,31,0,0.10)' }}>
        {resetDone ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8F5E9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', border: '3px solid #2D6A4F' }}>
              <span style={{ fontSize: 24, color: '#2D6A4F', fontWeight: 'bold' }}>✓</span>
            </div>
            <h3 style={{ color: '#3E1F00', marginBottom: 8 }}>Password Reset Successful!</h3>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
              Your password has been updated. You can now login with your new password.
            </p>
            <button onClick={() => setShowReset(false)}
              style={{ background: '#FF6B35', border: 'none', color: 'white',
                padding: '12px 32px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 'bold', fontSize: 15, fontFamily: 'Arial' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ color: '#3E1F00', margin: '0 0 6px', fontSize: 20 }}>Set New Password</h3>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Enter your new password below.</p>
            {resetError && (
              <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, color: '#C62828', fontSize: 13 }}>
                {resetError}
              </div>
            )}
            <form onSubmit={handleReset}>
              {[
                { label: 'NEW PASSWORD', val: newPassword, set: setNewPassword },
                { label: 'CONFIRM NEW PASSWORD', val: confirmPassword, set: setConfirmPassword },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888',
                    marginBottom: 6, fontWeight: 'bold' }}>{label}</label>
                  <input type="password" required value={val} onChange={(e) => set(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #FFB800', fontSize: 14, boxSizing: 'border-box',
                      outline: 'none', background: '#FFFDF8' }}/>
                </div>
              ))}
              <button type="submit" disabled={resetLoading}
                style={{ width: '100%', padding: '14px', background: resetLoading ? '#AAA' : '#3E1F00',
                  border: 'none', borderRadius: 8, color: '#FFB800', fontSize: 16,
                  fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1, fontFamily: 'Arial' }}>
                {resetLoading ? 'Resetting...' : 'RESET PASSWORD'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  // ── FORGOT SCREEN ─────────────────────────────────────
  if (showForgot) return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', boxSizing: 'border-box', fontFamily: 'Arial' }}>
      <InstallBanner/>
      <div style={{ textAlign: 'center', marginBottom: 28, width: '100%', maxWidth: 420 }}>
        <div style={{ background: '#3E1F00', borderRadius: 16, padding: '16px 24px',
          display: 'block', marginBottom: 12 }}>
          <div style={{ color: '#FFB800', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>SABIAS</div>
          <div style={{ color: '#FF6B35', fontSize: 11, marginTop: 4 }}>
            Sales & Business Intelligence Analytics System
          </div>
        </div>
        <div style={{ color: '#888', fontSize: 13 }}>Password Recovery</div>
      </div>
      <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px',
        width: '100%', maxWidth: 420, boxSizing: 'border-box',
        boxShadow: '0 4px 24px rgba(62,31,0,0.10)' }}>
        <h3 style={{ color: '#3E1F00', margin: '0 0 6px', fontSize: 20 }}>Forgot Password?</h3>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
          Enter your email address and we will send you a password reset link.
        </p>
        {forgotRole && (
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10,
            padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ color: '#E65100', fontWeight: 'bold', fontSize: 14, marginBottom: 6 }}>
              Password Reset Not Available
            </div>
            <div style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>
              As a <strong>{forgotRole}</strong>, you cannot reset your password directly.
              Please contact your <strong>Admin</strong> to reset your password for you.
            </div>
          </div>
        )}
        {forgotMsg && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 10,
            padding: '14px 18px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ color: '#2E7D32', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
              Reset Link Sent!
            </div>
            <div style={{ color: '#555', fontSize: 13 }}>
              {forgotMsg} Check your email inbox and click the link to reset your password.
            </div>
          </div>
        )}
        {forgotError && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, color: '#C62828', fontSize: 13 }}>
            {forgotError}
          </div>
        )}
        {!forgotMsg && !forgotRole && (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888',
                marginBottom: 6, fontWeight: 'bold' }}>EMAIL ADDRESS</label>
              <input type="email" required value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8,
                  border: '1.5px solid #FFB800', fontSize: 14, boxSizing: 'border-box',
                  outline: 'none', background: '#FFFDF8' }}/>
            </div>
            <button type="submit" disabled={forgotLoading}
              style={{ width: '100%', padding: '14px', background: forgotLoading ? '#AAA' : '#3E1F00',
                border: 'none', borderRadius: 8, color: '#FFB800', fontSize: 16,
                fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1,
                boxSizing: 'border-box', fontFamily: 'Arial' }}>
              {forgotLoading ? 'Sending...' : 'SEND RESET LINK'}
            </button>
          </form>
        )}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span onClick={() => {
            setShowForgot(false); setForgotMsg(''); setForgotError('');
            setForgotRole(''); setForgotEmail('');
          }} style={{ color: '#FF6B35', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );

  // ── MAIN LOGIN ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', boxSizing: 'border-box', fontFamily: 'Arial' }}>

      <InstallBanner/>

      <div style={{ textAlign: 'center', marginBottom: 28, width: '100%', maxWidth: 420,
        marginTop: showInstallBanner ? 60 : 0 }}>
        <div style={{ background: '#3E1F00', borderRadius: 16, padding: '16px 24px',
          display: 'block', marginBottom: 12 }}>
          <div style={{ color: '#FFB800', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>
            SABIAS
          </div>
          <div style={{ color: '#FF6B35', fontSize: 11, marginTop: 4 }}>
            Sales & Business Intelligence Analytics System
          </div>
        </div>
        <div style={{ color: '#888', fontSize: 13 }}>Sign in to your account</div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: '28px 24px',
        width: '100%', maxWidth: 420, boxSizing: 'border-box',
        boxShadow: '0 4px 24px rgba(62,31,0,0.10)' }}>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 8,
            padding: '10px 14px', marginBottom: 20, color: '#C0392B', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888',
              marginBottom: 6, fontWeight: 'bold' }}>EMAIL ADDRESS</label>
            <input type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8,
                border: '1.5px solid #FFB800', fontSize: 14,
                boxSizing: 'border-box', outline: 'none', background: '#FFFDF8' }}/>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888',
              marginBottom: 6, fontWeight: 'bold' }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'}
                value={password} required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '12px 60px 12px 14px', borderRadius: 8,
                  border: '1.5px solid #FFB800', fontSize: 14,
                  boxSizing: 'border-box', outline: 'none', background: '#FFFDF8' }}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#888', fontSize: 13, fontFamily: 'Arial' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span onClick={() => setShowForgot(true)}
              style={{ color: '#FF6B35', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>
              Forgot Password?
            </span>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#3E1F00', border: 'none',
              borderRadius: 8, color: '#FFB800', fontSize: 16, fontWeight: 'bold',
              cursor: 'pointer', letterSpacing: 1, boxSizing: 'border-box',
              fontFamily: 'Arial' }}>
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>
        </form>

        {/* Role buttons section */}
        <div style={{ marginTop: 28, borderTop: '1px solid #FFE8D0', paddingTop: 20 }}>
          <div style={{ fontSize: 11, color: '#AAA', textAlign: 'center',
            marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Account Type
          </div>
          <RoleButtons/>
        </div>

        {/* Sign Up */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#888', fontSize: 13 }}>
            New business?{' '}
            <span
              onClick={() => {
                setPressedSignUp(true);
                setTimeout(() => { setPressedSignUp(false); setShowRegister(true); }, 150);
              }}
              style={{
                color: pressedSignUp ? '#C0392B' : '#FF6B35',
                cursor: 'pointer', fontWeight: 'bold',
                transition: 'all 0.15s',
                transform: pressedSignUp ? 'scale(0.95)' : 'scale(1)',
                display: 'inline-block',
              }}>
              Sign Up Free
            </span>
          </span>
        </div>
      </div>

      {/* Role info dots */}
      <div style={{ marginTop: 24, display: 'flex', gap: 24, width: '100%',
        maxWidth: 420, justifyContent: 'center' }}>
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

      <div style={{ marginTop: 24, color: '#BBB', fontSize: 11,
        textAlign: 'center', padding: '0 16px' }}>
        SABIAS 2026 · Sales & Business Intelligence Analytics System
      </div>
    </div>
  );
}