import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function SalespersonNotifications({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState([]);
  const [filter, setFilter] = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API}/api/sales`, h);
      setSales(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateNotifications = () => {
    const notifications = [];

    // My recent sales
    const mySales = sales.filter(s => s.salesperson === user?.name).slice(0, 5);
    mySales.forEach((s) => {
      notifications.push({
        id: `sale-${s.id}`,
        type: 'success',
        icon: '💰',
        title: 'Sale Recorded',
        message: `Your sale of ${s.product} worth MK ${new Intl.NumberFormat('en-US').format(Math.round(s.revenue || 0))} was recorded successfully in ${s.region}.`,
        time: s.sale_date?.split('T')[0],
        category: 'Sales',
      });
    });

    // Performance notifications
    const myTotal = sales.filter(s => s.salesperson === user?.name)
      .reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);

    if (myTotal > 100000) {
      notifications.push({
        id: 'perf-1',
        type: 'success',
        icon: '🏆',
        title: 'Sales Milestone!',
        message: `Congratulations! You have exceeded MK ${new Intl.NumberFormat('en-US').format(Math.round(myTotal))} in total sales. Keep it up!`,
        time: 'Achievement',
        category: 'Performance',
      });
    }

    notifications.push({
      id: 'perf-2',
      type: 'info',
      icon: '📊',
      title: 'Weekly Target Reminder',
      message: 'Remember to record all your sales transactions before end of week for accurate reporting.',
      time: 'Reminder',
      category: 'Performance',
    });

    notifications.push({
      id: 'perf-3',
      type: 'info',
      icon: '📦',
      title: 'Product Update',
      message: 'New products have been added to inventory. Check the Products section for the latest stock available for sale.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-1',
      type: 'success',
      icon: '✅',
      title: 'System Online',
      message: 'SABIAS is fully operational. You can record sales and view your performance anytime.',
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
      case 'danger': return { bg: '#FFEBEE', border: '#FFCDD2', color: '#C62828', dot: '#E53935' };
      case 'warning': return { bg: '#FFF8E1', border: '#FFE082', color: '#E65100', dot: '#FF8F00' };
      case 'success': return { bg: '#E8F5E9', border: '#A5D6A7', color: '#2E7D32', dot: '#43A047' };
      default: return { bg: '#E3F2FD', border: '#90CAF9', color: '#1565C0', dot: '#1E88E5' };
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Notifications...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
            My Notifications
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
            Your sales updates and performance notifications
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Notifications', value: allNotifications.length, color: '#FF6B35' },
          { label: 'Unread', value: unreadCount, color: '#E63946' },
          { label: 'Sales Alerts', value: allNotifications.filter(n => n.category === 'Sales').length, color: '#2D6A4F' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 24, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Sales', 'Performance', 'System'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 13, border: 'none',
              background: filter === f ? '#3E1F00' : '#FFF8F0',
              color: filter === f ? '#FFB800' : '#888',
              boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}>
            {f}
            <span style={{ marginLeft: 6, background: filter === f ? '#FF6B35' : '#FFE8D0',
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
                border: `1px solid ${isRead ? '#FFE8D0' : style.border}`,
                borderRadius: 12, padding: 16, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
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
                      <span style={{ background: isRead ? '#F5F5F5' : style.bg,
                                     color: '#888', padding: '1px 8px',
                                     borderRadius: 10, fontSize: 10,
                                     border: `1px solid ${style.border}` }}>
                        {n.category}
                      </span>
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