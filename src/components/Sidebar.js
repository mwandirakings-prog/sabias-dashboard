import React, { useState, useEffect } from 'react';

const menuItems = {
  admin: [
    { label: 'Dashboard',     key: 'dashboard' },
    { label: 'Sales',         key: 'sales' },
    { label: 'Inventory',     key: 'inventory' },
    { label: 'Point of Sale', key: 'pos' },
    { label: 'Users',         key: 'users' },
    { label: 'Analytics',     key: 'analytics' },
    { label: 'Forecasting',   key: 'forecasting' },
    { label: 'Reports',       key: 'reports' },
    { label: 'Approvals',     key: 'approvals' },
    { label: 'Notifications', key: 'notifications' },
    { label: 'Settings',      key: 'settings' },
  ],
  salesperson: [
    { label: 'Dashboard',     key: 'dashboard' },
    { label: 'Point of Sale', key: 'pos' },
    { label: 'Cart Sell',     key: 'cart' },
    { label: 'New Sale',      key: 'newsale' },
    { label: 'Products',      key: 'products' },
    { label: 'My Sales',      key: 'mysales' },
    { label: 'Notifications', key: 'notifications' },
    { label: 'Profile',       key: 'profile' },
  ],
  viewer: [
    { label: 'Dashboard',     key: 'dashboard' },
    { label: 'Analytics',     key: 'analytics' },
    { label: 'Reports',       key: 'reports' },
    { label: 'Forecasting',   key: 'forecasting' },
    { label: 'Inventory',     key: 'inventory' },
    { label: 'Notifications', key: 'notifications' },
    { label: 'Profile',       key: 'profile' },
  ],
};

export default function Sidebar({ user, activePage, setActivePage, onLogout, onCollapse, pressedTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [localPressed, setLocalPressed] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const items = menuItems[user?.role] || menuItems.viewer;
  const width = collapsed ? 64 : 180;
  const [showMore, setShowMore] = useState(false);

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
  if (isMobile) {
    const bottomItems = items.slice(0, 4);
    const moreItems = items.slice(4);
    const hasMore = moreItems.length > 0;

    return (
      <>
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
                      <span style={{ fontSize: 11, color: active ? '#FFB800' : 'rgba(255,255,255,0.75)',
                        fontWeight: active ? 'bold' : 'normal', textAlign: 'center' }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
                <div onClick={handleLogout}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(230,17,38,0.15)',
                    userSelect: 'none',
                  }}>
                  <span style={{ fontSize: 11, color: '#FF6B35', fontWeight: 'bold' }}>Logout</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 56, background: '#3E1F00',
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
                  padding: '4px 0', cursor: 'pointer',
                  userSelect: 'none',
                  transform: pressed ? 'scale(0.88)' : 'scale(1)',
                  transition: 'transform 0.12s',
                }}>
                <span style={{
                  fontSize: 10, fontFamily: 'Arial',
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

          {hasMore && (
            <div onClick={() => setShowMore(!showMore)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '4px 0', cursor: 'pointer', userSelect: 'none',
              }}>
              <span style={{ fontSize: 10, fontFamily: 'Arial',
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

      <div style={{
        padding: collapsed ? '16px 0' : '20px',
        borderBottom: '1px solid rgba(255,184,0,0.2)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 60,
      }}>
        {!collapsed && (
          <div>
            <div style={{ color: '#FFB800', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>
              SABIAS
            </div>
            <div style={{ color: '#FF6B35', fontSize: 8, marginTop: 2, whiteSpace: 'nowrap' }}>
              Business Intelligence
            </div>
          </div>
        )}
        <button onClick={() => {
          const newVal = !collapsed;
          setCollapsed(newVal);
          if (onCollapse) onCollapse(newVal);
        }} style={{
          background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)',
          color: '#FFB800', borderRadius: 4, width: 24, height: 24,
          cursor: 'pointer', fontSize: 12, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontFamily: 'Arial',
        }}>
          {collapsed ? '>' : '<'}
        </button>
      </div>

      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,184,0,0.1)',
          background: 'rgba(255,107,53,0.1)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#FF6B35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: 13, marginBottom: 6,
          }}>
            {user?.name?.charAt(0)}
          </div>
          <div style={{
            color: 'white', fontSize: 12, fontWeight: 'bold',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.name}
          </div>
          <div style={{
            display: 'inline-block', background: '#FF6B35', color: 'white',
            fontSize: 9, padding: '1px 6px', borderRadius: 8,
            marginTop: 3, textTransform: 'capitalize',
          }}>
            {user?.role}
          </div>
        </div>
      )}

      {collapsed && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '10px 0',
          borderBottom: '1px solid rgba(255,184,0,0.1)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#FF6B35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: 12,
          }}>
            {user?.name?.charAt(0)}
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
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
                padding: collapsed ? '10px 0' : '8px 16px',
                cursor: 'pointer',
                background: active
                  ? 'rgba(255,184,0,0.15)'
                  : pressed
                  ? 'rgba(255,184,0,0.25)'
                  : 'transparent',
                borderLeft: active ? '3px solid #FFB800' : '3px solid transparent',
                color: active ? '#FFB800' : 'rgba(255,255,255,0.75)',
                fontSize: 12, fontFamily: 'Arial',
                whiteSpace: 'nowrap', overflow: 'hidden',
                transition: 'background 0.12s, transform 0.12s',
                transform: pressed ? 'scale(0.96)' : 'scale(1)',
                userSelect: 'none',
              }}>
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

      <div onClick={handleLogout} style={{
        padding: collapsed ? '10px 0' : '10px 16px',
        borderTop: '1px solid rgba(255,184,0,0.15)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: '#FF6B35', fontSize: 12, fontFamily: 'Arial',
        whiteSpace: 'nowrap',
        background: localPressed === 'logout'
          ? 'rgba(206,17,38,0.2)'
          : 'rgba(206,17,38,0.08)',
        transition: 'background 0.12s, transform 0.12s',
        transform: localPressed === 'logout' ? 'scale(0.97)' : 'scale(1)',
        userSelect: 'none',
      }}>
        {!collapsed && <span>Logout</span>}
      </div>
    </div>
  );
}