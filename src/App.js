import SalespersonNotifications from './pages/salesperson/SalespersonNotifications';
import Settings from './pages/admin/Settings';
import Notifications from './pages/admin/Notifications';
import Reports from './pages/admin/Reports';
import Forecasting from './pages/admin/Forecasting';
import Analytics from './pages/admin/Analytics';
import UserManagement from './pages/admin/UserManagement';
import Inventory from './pages/admin/Inventory';
import React, { useState } from 'react';
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

const ComingSoon = ({ page }) => (
  <div style={{ textAlign: 'center', padding: 80 }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
    <h2 style={{ color: '#3E1F00' }}>{page} — Coming Soon</h2>
    <p style={{ color: '#888' }}>This module is under construction.</p>
  </div>
);

function AdminApp({ user, token, logout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <AdminDashboard token={token}/>;
      case 'sales': return <AdminSales token={token}/>;
      case 'inventory': return <Inventory token={token}/>;
      case 'users': return <UserManagement token={token}/>;
      case 'analytics': return <Analytics token={token}/>;
      case 'forecasting': return <Forecasting token={token}/>;
      case 'reports': return <Reports token={token}/>;
      case 'notifications': return <Notifications token={token}/>;
      case 'settings': return <Settings user={user} token={token}/>;
      default: return <AdminDashboard token={token}/>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFF8F0' }}>
      <Sidebar user={user} activePage={activePage}
               setActivePage={setActivePage} onLogout={logout}
               onCollapse={(val) => setSidebarCollapsed(val)}/>
      <div style={{ marginLeft: sidebarCollapsed ? 64 : 220, flex: 1,
                    padding: 28, transition: 'margin-left 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 24,
                      paddingBottom: 16, borderBottom: '1px solid #FFE8D0' }}>
          <div style={{ color: '#FFB800', fontSize: 13, fontWeight: 'bold' }}>
            SABIAS · Admin Portal
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            Welcome back, <strong style={{ color: '#3E1F00' }}>{user?.name}</strong>
          </div>
        </div>
        {renderPage()}
      </div>
    </div>
  );
}

function SalespersonApp({ user, token, logout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <SalespersonDashboard token={token} user={user}/>;
      case 'newsale': return <NewSale token={token} user={user}/>;
      case 'mysales': return <MySales token={token} user={user}/>;
      case 'products': return <Products token={token}/>;
      case 'notifications': return <SalespersonNotifications token={token} user={user}/>;
      case 'profile': return <ComingSoon page="Profile"/>;
      default: return <SalespersonDashboard token={token} user={user}/>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFF8F0' }}>
      <Sidebar user={user} activePage={activePage}
               setActivePage={setActivePage} onLogout={logout}
               onCollapse={(val) => setSidebarCollapsed(val)}/>
      <div style={{ marginLeft: sidebarCollapsed ? 64 : 220, flex: 1,
                    padding: 28, transition: 'margin-left 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 24,
                      paddingBottom: 16, borderBottom: '1px solid #FFE8D0' }}>
          <div style={{ color: '#FFB800', fontSize: 13, fontWeight: 'bold' }}>
            SABIAS · Salesperson Portal
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            Welcome back, <strong style={{ color: '#3E1F00' }}>{user?.name}</strong>
          </div>
        </div>
        {renderPage()}
      </div>
    </div>
  );
}

function ViewerApp({ user, token, logout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <ViewerDashboard token={token} user={user}/>;
      case 'analytics': return <ViewerDashboard token={token} user={user}/>;
      case 'reports': return <ComingSoon page="Reports & Exports"/>;
      case 'forecasting': return <ComingSoon page="Forecasting & Analytics"/>;
      case 'inventory': return <ComingSoon page="Inventory View"/>;
      case 'notifications': return <ComingSoon page="Notifications"/>;
      case 'profile': return <ComingSoon page="Profile"/>;
      default: return <ViewerDashboard token={token} user={user}/>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F9FF' }}>
      <Sidebar user={user} activePage={activePage}
               setActivePage={setActivePage} onLogout={logout}
               onCollapse={(val) => setSidebarCollapsed(val)}/>
      <div style={{ marginLeft: sidebarCollapsed ? 64 : 220, flex: 1,
                    padding: 28, transition: 'margin-left 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 24,
                      paddingBottom: 16, borderBottom: '1px solid #D6EAF8' }}>
          <div style={{ color: '#2980B9', fontSize: 13, fontWeight: 'bold' }}>
            SABIAS · Viewer Portal
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            Welcome back, <strong style={{ color: '#2C3E50' }}>{user?.name}</strong>
          </div>
        </div>
        {renderPage()}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, token, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: '#FFF8F0', fontFamily: 'Arial' }}>
        <div style={{ color: '#3E1F00', fontSize: 18 }}>Loading SABIAS...</div>
      </div>
    );
  }

  if (!user) return <Login onLogin={() => {}}/>;

  if (user.role === 'admin') {
    return <AdminApp user={user} token={token} logout={logout}/>;
  }

  if (user.role === 'salesperson') {
    return <SalespersonApp user={user} token={token} logout={logout}/>;
  }

  if (user.role === 'viewer') {
    return <ViewerApp user={user} token={token} logout={logout}/>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: '#FFF8F0', fontFamily: 'Arial',
                  flexDirection: 'column', gap: 16 }}>
      <h2 style={{ color: '#3E1F00' }}>Welcome, {user.name}!</h2>
      <button onClick={logout}
        style={{ background: '#FF6B35', border: 'none', color: 'white',
                 padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                 fontWeight: 'bold' }}>
        Logout
      </button>
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