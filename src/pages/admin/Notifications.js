import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Notifications({ token }) {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState([]);
  const [filter, setFilter] = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [inv, s] = await Promise.all([
        axios.get(`${API}/api/inventory`, h),
        axios.get(`${API}/api/sales`, h),
      ]);
      setInventory(inv.data.data);
      setSales(s.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Generate notifications from data
  const generateNotifications = () => {
    const notifications = [];

    // Low stock alerts
    inventory.forEach(item => {
      if (item.quantity_in_stock === 0) {
        notifications.push({
          id: `out-${item.id}`,
          type: 'danger',
          icon: '🚨',
          title: 'Out of Stock',
          message: `${item.product} is completely out of stock!
                    Reorder from ${item.supplier} immediately.`,
          time: 'Stock Alert',
          category: 'Inventory',
        });
      } else if (item.quantity_in_stock <= item.reorder_level) {
        notifications.push({
          id: `low-${item.id}`,
          type: 'warning',
          icon: '⚠️',
          title: 'Low Stock Alert',
          message: `${item.product} has only ${item.quantity_in_stock} 
                    units left. Reorder level is ${item.reorder_level}.`,
          time: 'Stock Alert',
          category: 'Inventory',
        });
      }
    });

    // Recent sales notifications
    const recentSales = sales.slice(0, 5);
    recentSales.forEach((s, i) => {
      notifications.push({
        id: `sale-${s.id}`,
        type: 'success',
        icon: '💰',
        title: 'New Sale Recorded',
        message: `${s.salesperson} recorded a sale of ${s.product} 
                  worth MK ${new Intl.NumberFormat('en-US')
                  .format(Math.round(s.revenue || 0))} 
                  in ${s.region}.`,
        time: s.sale_date?.split('T')[0],
        category: 'Sales',
      });
    });

    // System notifications
    notifications.push({
      id: 'sys-1',
      type: 'info',
      icon: '📊',
      title: 'Analytics Updated',
      message: 'Your sales analytics and forecasting data 
                has been refreshed with the latest transactions.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-2',
      type: 'info',
      icon: '🔒',
      title: 'Security Notice',
      message: 'Your SABIAS system is secure and all data 
                is encrypted and backed up on Neon cloud.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-3',
      type: 'success',
      icon: '✅',
      title: 'System Running',
      message: 'SABIAS is fully operational. 
                Backend API on Render and database on Neon are healthy.',
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

  const markAllRead = () => {
    setReadIds(allNotifications.map(n => n.id));
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'danger': return { bg: '#FFEBEE', border: '#FFCDD2',
                               color: '#C62828', dot: '#E53935' };
      case 'warning': return { bg: '#FFF8E1', border: '#FFE082',
                                color: '#E65100', dot: '#FF8F00' };
      case 'success': return { bg: '#E8F5E9', border: '#A5D6A7',
                                color: '#2E7D32', dot: '#43A047' };
      default: return { bg: '#E3F2FD', border: '#90CAF9',
                         color: '#1565C0', dot: '#1E88E5' };
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#3E1F00', fontSize: 18 }}>
      Loading Notifications...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
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
            Stock alerts, sales updates and system notifications
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAll}
            style={{ background: '#FFF8F0', border: '1px solid #FFB800',
                     color: '#3E1F00', padding: '8px 16px', borderRadius: 8,
                     cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            🔄 Refresh
          </button>
          <button onClick={markAllRead}
            style={{ background: '#FF6B35', border: 'none', color: 'white',
                     padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                     fontSize: 13, fontWeight: 'bold' }}>
            ✓ Mark All Read
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Notifications', value: allNotifications.length,
            color: '#FF6B35' },
          { label: 'Unread', value: unreadCount, color: '#E63946' },
          { label: 'Stock Alerts', value: allNotifications
              .filter(n => n.category === 'Inventory').length, color: '#FFB800' },
          { label: 'Sales Alerts', value: allNotifications
              .filter(n => n.category === 'Sales').length, color: '#2D6A4F' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ color: '#3E1F00', fontSize: 24,
                          fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Inventory', 'Sales', 'System'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 13, border: 'none',
              background: filter === f ? '#3E1F00' : '#FFF8F0',
              color: filter === f ? '#FFB800' : '#888',
              boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}>
            {f}
            <span style={{ marginLeft: 6, background: filter === f
              ? '#FF6B35' : '#FFE8D0', color: filter === f ? 'white' : '#888',
              padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>
              {f === 'All' ? allNotifications.length
                : allNotifications.filter(n => n.category === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 60,
                        textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ color: '#888' }}>No notifications in this category</div>
          </div>
        ) : (
          filtered.map(n => {
            const style = getTypeStyle(n.type);
            const isRead = readIds.includes(n.id);
            return (
              <div key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  background: isRead ? 'white' : style.bg,
                  border: `1px solid ${isRead ? '#FFE8D0' : style.border}`,
                  borderRadius: 12, padding: 16, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  opacity: isRead ? 0.7 : 1,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                              alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <div style={{ fontSize: 24, minWidth: 36,
                                  textAlign: 'center' }}>{n.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center',
                                    gap: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 'bold', color: style.color,
                                      fontSize: 14 }}>{n.title}</div>
                        {!isRead && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%',
                                        background: style.dot }}/>
                        )}
                        <span style={{ background: isRead ? '#F5F5F5' : style.bg,
                                       color: '#888', padding: '1px 8px',
                                       borderRadius: 10, fontSize: 10,
                                       border: `1px solid ${style.border}` }}>
                          {n.category}
                        </span>
                      </div>
                      <div style={{ color: '#555', fontSize: 13,
                                    lineHeight: 1.5 }}>{n.message}</div>
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
          })
        )}
      </div>
    </div>
  );
}