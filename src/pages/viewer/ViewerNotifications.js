import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function ViewerNotifications({ token, user }) {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState([]);
  const [filter, setFilter] = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [s, inv] = await Promise.all([
        axios.get(`${API}/api/sales`, h),
        axios.get(`${API}/api/inventory`, h),
      ]);
      setSales(s.data.data);
      setInventory(inv.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateNotifications = () => {
    const notifications = [];

    // Low stock alerts — read only view
    inventory.filter(i => i.quantity_in_stock <= i.reorder_level).forEach(item => {
      notifications.push({
        id: `stock-${item.id}`,
        type: item.quantity_in_stock === 0 ? 'danger' : 'warning',
        icon: item.quantity_in_stock === 0 ? '🚨' : '⚠️',
        title: item.quantity_in_stock === 0 ? 'Out of Stock' : 'Low Stock',
        message: `${item.product} has ${item.quantity_in_stock} units remaining. Reorder level is ${item.reorder_level} units.`,
        time: 'Stock Alert',
        category: 'Inventory',
      });
    });

    // Recent sales summary
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
    notifications.push({
      id: 'sales-1',
      type: 'success',
      icon: '💰',
      title: 'Sales Performance Update',
      message: `Total system revenue is MK ${new Intl.NumberFormat('en-US').format(Math.round(totalRevenue))} from ${sales.length} transactions recorded.`,
      time: 'Analytics',
      category: 'Sales',
    });

    notifications.push({
      id: 'sys-1',
      type: 'info',
      icon: '📊',
      title: 'Dashboard Updated',
      message: 'Your viewer dashboard has been updated with the latest sales and analytics data.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-2',
      type: 'info',
      icon: '🔒',
      title: 'Read Only Access',
      message: 'You have view-only access to SABIAS. Contact your admin to request additional permissions.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-3',
      type: 'success',
      icon: '✅',
      title: 'System Online',
      message: 'SABIAS is fully operational. All dashboards and analytics are available for viewing.',
      time: 'System',
      category: 'System',
    });

    return notifications;
  };

  const allNotifications = generateNotifications();
  const filtered = filter === 'All'
    ? allNotifications
    : allNotifications.filter(n => n.category === filter);
  const unreadCount = allNotifications.filter(n => !readIds.includes(n.id)).length;

  const markRead = (id) => {
    if (!readIds.includes(id)) setReadIds([...readIds, id]);
  };

  const markAllRead = () => setReadIds(allNotifications.map(n => n.id));

  const getTypeStyle = (type) => {
    switch (type) {
      case 'danger': return { bg: '#FFEBEE', border: '#FFCDD2', color: '#C62828', dot: '#E53935' };
      case 'warning': return { bg: '#FFF8E1', border: '#FFE082', color: '#E65100', dot: '#FF8F00' };
      case 'success': return { bg: '#E8F5E9', border: '#A5D6A7', color: '#2E7D32', dot: '#43A047' };
      default: return { bg: '#E3F2FD', border: '#90CAF9', color: '#1565C0', dot: '#1E88E5' };
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#2C3E50', fontSize: 18 }}>
      Loading Notifications...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#2C3E50', margin: 0, fontSize: 22 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ background: '#E63946', color: 'white',
                             fontSize: 12, fontWeight: 'bold',
                             padding: '2px 8px', borderRadius: 10,
                             marginLeft: 10 }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            System alerts and business updates
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAll}
            style={{ background: '#EBF5FB', border: '1px solid #2980B9',
                     color: '#2C3E50', padding: '8px 16px', borderRadius: 8,
                     cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            🔄 Refresh
          </button>
          <button onClick={markAllRead}
            style={{ background: '#2980B9', border: 'none', color: 'white',
                     padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                     fontSize: 13, fontWeight: 'bold' }}>
            ✓ Mark All Read
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Notifications', value: allNotifications.length, color: '#2980B9' },
          { label: 'Unread', value: unreadCount, color: '#E63946' },
          { label: 'Stock Alerts', value: allNotifications.filter(n => n.category === 'Inventory').length, color: '#E65100' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#2C3E50', fontSize: 24, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Inventory', 'Sales', 'System'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 13, border: 'none',
              background: filter === f ? '#2C3E50' : '#EBF5FB',
              color: filter === f ? 'white' : '#888',
            }}>
            {f}
            <span style={{ marginLeft: 6, background: filter === f ? '#2980B9' : '#D6EAF8',
                           color: filter === f ? 'white' : '#888',
                           padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>
              {f === 'All' ? allNotifications.length : allNotifications.filter(n => n.category === f).length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(n => {
          const style = getTypeStyle(n.type);
          const isRead = readIds.includes(n.id);
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              style={{
                background: isRead ? 'white' : style.bg,
                border: `1px solid ${isRead ? '#D6EAF8' : style.border}`,
                borderRadius: 12, padding: 16, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                opacity: isRead ? 0.7 : 1,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <div style={{ fontSize: 24, minWidth: 36, textAlign: 'center' }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 'bold', color: style.color,
                                    fontSize: 14 }}>{n.title}</div>
                      {!isRead && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%',
                                      background: style.dot }}/>
                      )}
                    </div>
                    <div style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column',
                              alignItems: 'flex-end', gap: 6, marginLeft: 12 }}>
                  <div style={{ color: '#AAA', fontSize: 11,
                                whiteSpace: 'nowrap' }}>{n.time}</div>
                  {isRead ? (
                    <span style={{ color: '#AAA', fontSize: 11 }}>✓ Read</span>
                  ) : (
                    <span style={{ color: style.color, fontSize: 11,
                                   fontWeight: 'bold' }}>● Unread</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}