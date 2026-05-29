import React, { useState } from 'react';

const menuItems = {
  admin: [
    { label: 'Dashboard',     key: 'dashboard' },
    { label: 'Sales',         key: 'sales' },
    { label: 'Inventory',     key: 'inventory' },
    { label: 'Users',         key: 'users' },
    { label: 'Analytics',     key: 'analytics' },
    { label: 'Forecasting',   key: 'forecasting' },
    { label: 'Reports',       key: 'reports' },
    { label: 'Notifications', key: 'notifications' },
    { label: 'Settings',      key: 'settings' },
  ],
  salesperson: [
    { label: 'Dashboard',     key: 'dashboard' },
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
  const items = menuItems[user?.role] || menuItems.viewer;
  const width = collapsed ? 64 : 220;

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
          transition: 'transform 0.15s',
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
                padding: collapsed ? '13px 0' : '12px 20px',
                cursor: 'pointer',
                background: active
                  ? 'rgba(255,184,0,0.15)'
                  : pressed
                  ? 'rgba(255,184,0,0.25)'
                  : 'transparent',
                borderLeft: active
                  ? '3px solid #FFB800'
                  : '3px solid transparent',
                color: active ? '#FFB800' : 'rgba(255,255,255,0.75)',
                fontSize: 13, fontFamily: 'Arial',
                whiteSpace: 'nowrap', overflow: 'hidden',
                transition: 'background 0.12s, transform 0.12s',
                transform: pressed ? 'scale(0.96)' : 'scale(1)',
                borderRadius: pressed ? 4 : 0,
                userSelect: 'none',
              }}>
              {collapsed ? (
                <span style={{
                  fontSize: 11, fontWeight: 'bold',
                  color: 'inherit', letterSpacing: 0.5,
                  transition: 'transform 0.12s',
                  transform: pressed ? 'scale(0.9)' : 'scale(1)',
                  display: 'inline-block',
                }}>
                  {item.label.slice(0, 2).toUpperCase()}
                </span>
              ) : (
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
        userSelect: 'none',
      }}>
        {collapsed ? (
          <span style={{ fontWeight: 'bold', fontSize: 11 }}>LO</span>
        ) : (
          <span>Logout</span>
        )}
      </div>
    </div>
  );
}