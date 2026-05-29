import ViewerForecasting from './pages/viewer/ViewerForecasting';
import ViewerReports from './pages/viewer/ViewerReports';
import ViewerInventory from './pages/viewer/ViewerInventory';
import ViewerProfile from './pages/viewer/ViewerProfile';
import ViewerNotifications from './pages/viewer/ViewerNotifications';
import Profile from './pages/salesperson/Profile';
import SalespersonNotifications from './pages/salesperson/SalespersonNotifications';
import SalespersonCart from './pages/salesperson/SalespersonCart';
import Settings from './pages/admin/Settings';
import SaleApprovals from './pages/admin/SaleApprovals';
import Notifications from './pages/admin/Notifications';
import Reports from './pages/admin/Reports';
import Forecasting from './pages/admin/Forecasting';
import Analytics from './pages/admin/Analytics';
import UserManagement from './pages/admin/UserManagement';
import Inventory from './pages/admin/Inventory';
import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSales from './pages/admin/AdminSales';
import SalespersonDashboard from './pages/salesperson/SalespersonDashboard';
import NewSale from './pages/salesperson/NewSale';
import MySales from './pages/salesperson/MySales';
import Products from './pages/salesperson/Products';
import ViewerDashboard from './pages/viewer/ViewerDashboard';
import SuperAdmin from './SuperAdmin';
import TrialBanner from './TrialBanner';
import LockedScreen from './LockedScreen';
import SubscribePage from './SubscribePage';

/* eslint-disable no-unused-vars */
const ComingSoon = ({ page }) => (
  <div style={{ textAlign: 'center', padding: 80 }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
    <h2 style={{ color: '#3E1F00' }}>{page} — Coming Soon</h2>
    <p style={{ color: '#888' }}>This module is under construction.</p>
  </div>
);

// ── PAGE TRANSITION WRAPPER ───────────────────────────────
const PageWrapper = ({ children, pageKey }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [pageKey]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.18s ease, transform 0.18s ease',
    }}>
      {children}
    </div>
  );
};

// ── PAYMENT SUCCESS / FAILED SCREENS ─────────────────────
const PaymentSuccess = ({ onContinue }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#FFF8F0',
    fontFamily: 'Arial', padding: 24
  }}>
    <div style={{
      background: 'white', borderRadius: 16, padding: 40,
      maxWidth: 460, width: '100%', textAlign: 'center',
      boxShadow: '0 8px 32px rgba(62,31,0,0.1)'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#E8F5E9', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px', fontSize: 36
      }}>✓</div>
      <div style={{ color: '#2D6A4F', fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>
        Payment Successful!
      </div>
      <div style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
        Your SABIAS subscription has been activated.
        You now have unlimited access to all features.
        A confirmation email has been sent to you.
      </div>
      <button onClick={onContinue} style={{
        background: '#FF6B35', border: 'none', color: 'white',
        padding: '12px 32px', borderRadius: 10, cursor: 'pointer',
        fontWeight: 'bold', fontSize: 15, fontFamily: 'Arial'
      }}>
        Continue to SABIAS
      </button>
    </div>
  </div>
);

const PaymentFailed = ({ onTryAgain, onContinue }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#FFF8F0',
    fontFamily: 'Arial', padding: 24
  }}>
    <div style={{
      background: 'white', borderRadius: 16, padding: 40,
      maxWidth: 460, width: '100%', textAlign: 'center',
      boxShadow: '0 8px 32px rgba(62,31,0,0.1)'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#FFEBEE', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px', fontSize: 36
      }}>✗</div>
      <div style={{ color: '#C62828', fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>
        Payment Not Completed
      </div>
      <div style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
        The payment was not completed. No money has been charged.
        You can try again or contact us on WhatsApp 0996 175 162 for help.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onTryAgain} style={{
          background: '#FF6B35', border: 'none', color: 'white',
          padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 'bold', fontSize: 14, fontFamily: 'Arial'
        }}>Try Again</button>
        <button onClick={onContinue} style={{
          background: 'transparent', border: '1px solid #FFE8D0',
          color: '#7A5C3A', padding: '12px 24px', borderRadius: 10,
          cursor: 'pointer', fontSize: 14, fontFamily: 'Arial'
        }}>Continue Anyway</button>
      </div>
    </div>
  </div>
);

const SUPER_ADMIN_EMAIL = 'sabiascustomercare@gmail.com';

// ── ADMIN APP ─────────────────────────────────────────────
function AdminApp({ user, token, logout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lockedMessage, setLockedMessage] = useState(null);
  const [pressedTab, setPressedTab] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLocked = useCallback((msg) => setLockedMessage(msg), []);

  const handlePageChange = useCallback((page) => {
    setPressedTab(page);
    setTimeout(() => setPressedTab(null), 200);
    setActivePage(page);
  }, []);

  if (lockedMessage) return <LockedScreen message={lockedMessage} onLogout={logout}/>;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <AdminDashboard token={token} user={user}/>;
      case 'sales':         return <AdminSales token={token} user={user}/>;
      case 'inventory':     return <Inventory token={token} user={user}/>;
      case 'users':         return <UserManagement token={token} user={user}/>;
      case 'analytics':     return <Analytics token={token} user={user}/>;
      case 'forecasting':   return <Forecasting token={token} user={user}/>;
      case 'reports':       return <Reports token={token} user={user}/>;
      case 'notifications': return <Notifications token={token} user={user}/>;
      case 'settings':      return <Settings user={user} token={token}/>;
      case 'approvals':     return <SaleApprovals token={token} user={user}/>;
      default:              return <AdminDashboard token={token} user={user}/>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFF8F0' }}>
      <Sidebar
        user={user}
        activePage={activePage}
        setActivePage={handlePageChange}
        onLogout={logout}
        onCollapse={(val) => setSidebarCollapsed(val)}
        pressedTab={pressedTab}
      />
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 220),
        flex: 1, padding: isMobile ? '16px 14px' : 28,
        paddingBottom: isMobile ? 80 : 28,
        transition: 'margin-left 0.25s ease',
        minWidth: 0,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
          paddingBottom: 16, borderBottom: '1px solid #FFE8D0',
          flexWrap: 'wrap', gap: 6,
        }}>
          <div style={{ color: '#FFB800', fontSize: 12, fontWeight: 'bold' }}>
            SABIAS · Admin ·{' '}
            <span style={{ color: '#FF6B35' }}>{user?.company || ''}</span>
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            Welcome back,{' '}
            <strong style={{ color: '#3E1F00' }}>{user?.name}</strong>
          </div>
        </div>
        <TrialBanner token={token} user={user} onLocked={handleLocked}/>
        <PageWrapper pageKey={activePage}>
          {renderPage()}
        </PageWrapper>
      </div>
    </div>
  );
}

// ── SALESPERSON APP ───────────────────────────────────────
function SalespersonApp({ user, token, logout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lockedMessage, setLockedMessage] = useState(null);
  const [pressedTab, setPressedTab] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLocked = useCallback((msg) => setLockedMessage(msg), []);

  const handlePageChange = useCallback((page) => {
    setPressedTab(page);
    setTimeout(() => setPressedTab(null), 200);
    setActivePage(page);
  }, []);

  if (lockedMessage) return <LockedScreen message={lockedMessage} onLogout={logout}/>;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <SalespersonDashboard token={token} user={user}/>;
      case 'newsale':       return <NewSale token={token} user={user}/>;
      case 'mysales':       return <MySales token={token} user={user}/>;
      case 'products':      return <Products token={token} user={user}/>;
      case 'cart':          return <SalespersonCart token={token} user={user}/>;
      case 'notifications': return <SalespersonNotifications token={token} user={user}/>;
      case 'profile':       return <Profile token={token} user={user}/>;
      default:              return <SalespersonDashboard token={token} user={user}/>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFF8F0' }}>
      <Sidebar
        user={user}
        activePage={activePage}
        setActivePage={handlePageChange}
        onLogout={logout}
        onCollapse={(val) => setSidebarCollapsed(val)}
        pressedTab={pressedTab}
      />
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 220),
        flex: 1, padding: isMobile ? '16px 14px' : 28,
        paddingBottom: isMobile ? 80 : 28,
        transition: 'margin-left 0.25s ease',
        minWidth: 0,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
          paddingBottom: 16, borderBottom: '1px solid #FFE8D0',
          flexWrap: 'wrap', gap: 6,
        }}>
          <div style={{ color: '#FFB800', fontSize: 12, fontWeight: 'bold' }}>
            SABIAS · Salesperson ·{' '}
            <span style={{ color: '#FF6B35' }}>{user?.company || ''}</span>
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            Welcome back,{' '}
            <strong style={{ color: '#3E1F00' }}>{user?.name}</strong>
          </div>
        </div>
        <TrialBanner token={token} user={user} onLocked={handleLocked}/>
        <PageWrapper pageKey={activePage}>
          {renderPage()}
        </PageWrapper>
      </div>
    </div>
  );
}

// ── VIEWER APP ────────────────────────────────────────────
function ViewerApp({ user, token, logout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lockedMessage, setLockedMessage] = useState(null);
  const [pressedTab, setPressedTab] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLocked = useCallback((msg) => setLockedMessage(msg), []);

  const handlePageChange = useCallback((page) => {
    setPressedTab(page);
    setTimeout(() => setPressedTab(null), 200);
    setActivePage(page);
  }, []);

  if (lockedMessage) return <LockedScreen message={lockedMessage} onLogout={logout}/>;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <ViewerDashboard token={token} user={user}/>;
      case 'analytics':     return <ViewerDashboard token={token} user={user}/>;
      case 'mysales':       return <MySales token={token} user={user}/>;
      case 'reports':       return <ViewerReports token={token} user={user}/>;
      case 'forecasting':   return <ViewerForecasting token={token} user={user}/>;
      case 'inventory':     return <ViewerInventory token={token} user={user}/>;
      case 'notifications': return <ViewerNotifications token={token} user={user}/>;
      case 'profile':       return <ViewerProfile token={token} user={user}/>;
      default:              return <ViewerDashboard token={token} user={user}/>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F9FF' }}>
      <Sidebar
        user={user}
        activePage={activePage}
        setActivePage={handlePageChange}
        onLogout={logout}
        onCollapse={(val) => setSidebarCollapsed(val)}
        pressedTab={pressedTab}
      />
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 220),
        flex: 1, padding: isMobile ? '16px 14px' : 28,
        paddingBottom: isMobile ? 80 : 28,
        transition: 'margin-left 0.25s ease',
        minWidth: 0,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
          paddingBottom: 16, borderBottom: '1px solid #D6EAF8',
          flexWrap: 'wrap', gap: 6,
        }}>
          <div style={{ color: '#2980B9', fontSize: 12, fontWeight: 'bold' }}>
            SABIAS · Viewer ·{' '}
            <span style={{ color: '#FF6B35' }}>{user?.company || ''}</span>
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            Welcome back,{' '}
            <strong style={{ color: '#2C3E50' }}>{user?.name}</strong>
          </div>
        </div>
        <TrialBanner token={token} user={user} onLocked={handleLocked}/>
        <PageWrapper pageKey={activePage}>
          {renderPage()}
        </PageWrapper>
      </div>
    </div>
  );
}

// ── APP CONTENT ───────────────────────────────────────────
function AppContent() {
  const { user, token, loading, logout } = useAuth();
  const [paymentResult, setPaymentResult] = useState(null);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [paymentRef, setPaymentRef] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const ref = params.get('ref');
    if (payment === 'success') {
      setPaymentResult('success');
      setPaymentRef(ref);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'failed') {
      setPaymentResult('failed');
      setPaymentRef(ref);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#FFF8F0', fontFamily: 'Arial'
      }}>
        <div style={{ color: '#3E1F00', fontSize: 18 }}>Loading SABIAS...</div>
      </div>
    );
  }

  if (!user) return <Login onLogin={() => {}}/>;

  if (paymentResult === 'success') {
    return <PaymentSuccess onContinue={() => setPaymentResult(null)}/>;
  }

  if (paymentResult === 'failed') {
    return (
      <PaymentFailed
        onTryAgain={() => { setPaymentResult(null); setShowSubscribe(true); }}
        onContinue={() => setPaymentResult(null)}
      />
    );
  }

  if (showSubscribe && user) {
    return (
      <SubscribePage
        token={token} user={user}
        onClose={() => setShowSubscribe(false)}
        dailyCount={0} dailyLimit={10} isFullAccess={false}
      />
    );
  }

  if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return <SuperAdmin user={user} token={token} onLogout={logout}/>;
  }

  if (user.role === 'admin')       return <AdminApp user={user} token={token} logout={logout}/>;
  if (user.role === 'salesperson') return <SalespersonApp user={user} token={token} logout={logout}/>;
  if (user.role === 'viewer')      return <ViewerApp user={user} token={token} logout={logout}/>;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#FFF8F0',
      fontFamily: 'Arial', flexDirection: 'column', gap: 16
    }}>
      <h2 style={{ color: '#3E1F00' }}>Welcome, {user.name}!</h2>
      <button onClick={logout} style={{
        background: '#FF6B35', border: 'none', color: 'white',
        padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'
      }}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent/>
    </AuthProvider>
  );
}
