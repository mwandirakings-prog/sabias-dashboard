import React, { useState, useEffect } from 'react';

const menuItems = {
  admin: [
    { label: 'Dashboard',     key: 'dashboard',     icon: '📊' },
    { label: 'Sales',         key: 'sales',         icon: '💰' },
    { label: 'Inventory',     key: 'inventory',     icon: '📦' },
    { label: 'Users',         key: 'users',         icon: '👥' },
    { label: 'Analytics',     key: 'analytics',     icon: '📈' },
    { label: 'Forecasting',   key: 'forecasting',   icon: '🔮' },
    { label: 'Reports',       key: 'reports',       icon: '📄' },
    { label: 'Approvals',     key: 'approvals',     icon: '✅' },
    { label: 'Notifications', key: 'notifications', icon: '🔔' },
    { label: 'Settings',      key: 'settings',      icon: '⚙️' },
  ],
  salesperson: [
    { label: 'Dashboard',     key: 'dashboard',     icon: '📊' },
    { label: 'Cart Sell',     key: 'cart',          icon: '🛒' },
    { label: 'New Sale',      key: 'newsale',       icon: '➕' },
    { label: 'Products',      key: 'products',      icon: '📦' },
    { label: 'My Sales',      key: 'mysales',       icon: '📋' },
    { label: 'Notifications', key: 'notifications', icon: '🔔' },
    { label: 'Profile',       key: 'profile',       icon: '👤' },
  ],
  viewer: [
    { label: 'Dashboard',     key: 'dashboard',     icon: '📊' },
    { label: 'Analytics',     key: 'analytics',     icon: '📈' },
    { label: 'Reports',       key: 'reports',       icon: '📄' },
    { label: 'Forecasting',   key: 'forecasting',   icon: '🔮' },
    { label: 'Inventory',     key: 'inventory',     icon: '📦' },
    { label: 'Notifications', key: 'notifications', icon: '🔔' },
    { label: 'Profile',       key: 'profile',       icon: '👤' },
  ],
};

export default function Sidebar({ user, activePage, setActivePage, onLogout, onCollapse, pressedTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [localPressed, setLocalPressed] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const items = menuItems[user?.role] || menuItems.viewer;
  const width = collapsed ? 64 : 220;
  const [showMore, setShowMore] = useState(false);

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (key) => {
    setLocalPressed(key);
    setTimeout(() => setLocalPressed(null), 200);
    setActivePage(key);
  };

  const handleLogout = () => {
    setLocalPressed('logout');
    setTimeout(() => {
      setLocalPressed(null);
      onLogout();
    }, 150);
  };

  const isPressed = (key) => localPressed === key || pressedTab === key;

  // ── MOBILE: Bottom Tab Bar ────────────────────────────────
  // Show max 5 tabs on bottom; overflow goes into a "More" sheet
  if (isMobile) {
    const bottomItems = items.slice(0, 4);
    const moreItems = items.slice(4);
    const hasMore = moreItems.length > 0;

    return (
      <>
        {/* More Sheet overlay */}
        {showMore && (
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.5)'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: 64, left: 0, right: 0,
                background: '#3E1F00', borderRadius: '16px 16px 0 0',
                padding: '16px 8px 8px', zIndex: 201,
              }}
            >
              <div style={{ color: '#FFB800', fontSize: 11, fontWeight: 'bold',
                textTransform: 'uppercase', letterSpacing: 1,
                textAlign: 'center', marginBottom: 12, opacity: 0.7 }}>
                More
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {moreItems.map(item => {
                  const active = activePage === item.key;
                  return (
                    <div key={item.key} onClick={() => { handleItemClick(item.key); setShowMore(false); }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
                        background: active ? 'rgba(255,184,0,0.2)' : 'rgba(255,255,255,0.05)',
                        userSelect: 'none',
                      }}>
                      <span style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</span>
                      <span style={{ fontSize: 10, color: active ? '#FFB800' : 'rgba(255,255,255,0.75)',
                        fontWeight: active ? 'bold' : 'normal', textAlign: 'center' }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
                {/* Logout in more sheet */}
                <div onClick={handleLogout}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(230,17,38,0.15)',
                    userSelect: 'none',
                  }}>
                  <span style={{ fontSize: 22, marginBottom: 4 }}>🚪</span>
                  <span style={{ fontSize: 10, color: '#FF6B35', fontWeight: 'bold' }}>Logout</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav Bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64, background: '#3E1F00',
          borderTop: '1px solid rgba(255,184,0,0.2)',
          display: 'flex', alignItems: 'center',
          zIndex: 150, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {bottomItems.map(item => {
            const active = activePage === item.key;
            const pressed = isPressed(item.key);
            return (
              <div key={item.key} onClick={() => handleItemClick(item.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '6px 0', cursor: 'pointer',
                  userSelect: 'none',
                  transform: pressed ? 'scale(0.88)' : 'scale(1)',
                  transition: 'transform 0.12s',
                }}>
                <span style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</span>
                <span style={{
                  fontSize: 9, fontFamily: 'Arial',
                  color: active ? '#FFB800' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 'bold' : 'normal',
                }}>
                  {item.label.split(' ')[0]}
                </span>
                {active && (
                  <div style={{
                    position: 'absolute', bottom: 0,
                    width: 28, height: 2, borderRadius: 2,
                    background: '#FFB800',
                  }}/>
                )}
              </div>
            );
          })}

          {/* More button */}
          {hasMore && (
            <div onClick={() => setShowMore(!showMore)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '6px 0', cursor: 'pointer', userSelect: 'none',
              }}>
              <span style={{ fontSize: 22, marginBottom: 2 }}>☰</span>
              <span style={{ fontSize: 9, fontFamily: 'Arial',
                color: 'rgba(255,255,255,0.6)' }}>More</span>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── DESKTOP: Side Drawer ──────────────────────────────────
  return (
    <div style={{
      width, minHeight: '100vh', background: '#3E1F00',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 100,
      boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
      transition: 'width 0.25s ease', overflow: 'hidden',
    }}>

      {/* Logo + Collapse Toggle */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px',
        borderBottom: '1px solid rgba(255,184,0,0.2)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 72,
      }}>
        {!collapsed && (
          <div>
            <div style={{ color: '#FFB800', fontSize: 22, fontWeight: 'bold', letterSpacing: 3 }}>
              SABIAS
            </div>
            <div style={{ color: '#FF6B35', fontSize: 9, marginTop: 2, whiteSpace: 'nowrap' }}>
              Business Intelligence System
            </div>
          </div>
        )}
        <button onClick={() => {
          const newVal = !collapsed;
          setCollapsed(newVal);
          if (onCollapse) onCollapse(newVal);
        }} style={{
          background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)',
          color: '#FFB800', borderRadius: 6, width: 28, height: 28,
          cursor: 'pointer', fontSize: 14, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontFamily: 'Arial',
        }}>
          {collapsed ? '>' : '<'}
        </button>
      </div>

      {/* User Info — expanded */}
      {!collapsed && (
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,184,0,0.1)',
          background: 'rgba(255,107,53,0.1)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#FF6B35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: 15, marginBottom: 8,
          }}>
            {user?.name?.charAt(0)}
          </div>
          <div style={{
            color: 'white', fontSize: 13, fontWeight: 'bold',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.name}
          </div>
          <div style={{
            display: 'inline-block', background: '#FF6B35', color: 'white',
            fontSize: 10, padding: '2px 8px', borderRadius: 10,
            marginTop: 4, textTransform: 'capitalize',
          }}>
            {user?.role}
          </div>
        </div>
      )}

      {/* User avatar — collapsed */}
      {collapsed && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '12px 0',
          borderBottom: '1px solid rgba(255,184,0,0.1)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#FF6B35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: 14,
          }}>
            {user?.name?.charAt(0)}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {items.map(item => {
          const active = activePage === item.key;
          const pressed = isPressed(item.key);
          return (
            <div key={item.key}
              onClick={() => handleItemClick(item.key)}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '13px 0' : '11px 20px',
                cursor: 'pointer',
                background: active
                  ? 'rgba(255,184,0,0.15)'
                  : pressed
                  ? 'rgba(255,184,0,0.25)'
                  : 'transparent',
                borderLeft: active ? '3px solid #FFB800' : '3px solid transparent',
                color: active ? '#FFB800' : 'rgba(255,255,255,0.75)',
                fontSize: 13, fontFamily: 'Arial',
                whiteSpace: 'nowrap', overflow: 'hidden',
                transition: 'background 0.12s, transform 0.12s',
                transform: pressed ? 'scale(0.96)' : 'scale(1)',
                userSelect: 'none', gap: 10,
              }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{
                  transition: 'transform 0.12s',
                  transform: pressed ? 'translateX(3px)' : 'translateX(0)',
                  display: 'inline-block',
                }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <div onClick={handleLogout} style={{
        padding: collapsed ? '14px 0' : '14px 20px',
        borderTop: '1px solid rgba(255,184,0,0.15)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: '#FF6B35', fontSize: 13, fontFamily: 'Arial',
        whiteSpace: 'nowrap',
        background: localPressed === 'logout'
          ? 'rgba(206,17,38,0.2)'
          : 'rgba(206,17,38,0.08)',
        transition: 'background 0.12s, transform 0.12s',
        transform: localPressed === 'logout' ? 'scale(0.97)' : 'scale(1)',
        userSelect: 'none', gap: 10,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>🚪</span>
        {!collapsed && <span>Logout</span>}
      </div>
    </div>
  );
}