import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function SalespersonNotifications({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/sales`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSales(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const generateNotifications = () => {
    const notifications = [];
    const mySales = sales.filter(s => s.salesperson === user?.name).slice(0, 5);

    mySales.forEach(s => {
      notifications.push({
        id: `sale-${s.id}`, type: 'success', icon: '💰',
        title: 'Sale Recorded',
        summary: `${s.product} — MK ${fmt(s.revenue)} in ${s.region}.`,
        message: `Your sale was recorded successfully!\n\nProduct: ${s.product}\nCategory: ${s.category}\nBranch: ${s.region}\nCustomer: ${s.customer || 'Walk-in'}\nQuantity: ${s.quantity} units\nRevenue: MK ${fmt(s.revenue)}\nProfit: MK ${fmt(s.profit)}\nPayment: ${s.payment}\nDate: ${s.sale_date?.split('T')[0]}`,
        time: s.sale_date?.split('T')[0], category: 'Sales',
      });
    });

    const myTotal = sales.filter(s => s.salesperson === user?.name)
      .reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
    const myCount = sales.filter(s => s.salesperson === user?.name).length;

    if (myTotal > 0) {
      notifications.push({
        id: 'perf-1', type: 'success', icon: '🏆',
        title: myTotal > 1000000 ? 'Million Club!' : 'Sales Milestone!',
        summary: `You have recorded MK ${fmt(myTotal)} across ${myCount} transactions.`,
        message: `Performance Summary for ${user?.name}:\n\nTotal Revenue: MK ${fmt(myTotal)}\nTotal Transactions: ${myCount}\n\n${myTotal > 1000000 ? 'Outstanding! You have crossed MK 1,000,000!' : myTotal > 500000 ? 'Great work! You are on track!' : 'Keep going! Every sale counts!'}\n\nKeep recording all sales to maintain accurate data.`,
        time: 'Achievement', category: 'Performance',
      });
    }

    notifications.push({
      id: 'tip-1', type: 'info', icon: '📊',
      title: 'Weekly Target Reminder',
      summary: 'Record all sales before end of week for accurate reporting.',
      message: 'Weekly Reminder:\n\nEnsure all sales are recorded before end of week. This helps:\n\n• Your performance to be tracked correctly\n• Admin to see real-time business data\n• Inventory to be updated accurately',
      time: 'Reminder', category: 'Performance',
    });

    notifications.push({
      id: 'sys-1', type: 'success', icon: '✅',
      title: 'SABIAS System Online',
      summary: 'All systems operational. Record sales anytime.',
      message: `System Status: All systems online.\n\nLogged in as:\nName: ${user?.name}\nRole: Salesperson\nCompany: ${user?.company || 'N/A'}\nBranch: ${user?.region || 'All'}`,
      time: 'System', category: 'System',
    });

    return notifications;
  };

  const allNotifications = generateNotifications();
  const filtered = filter === 'All' ? allNotifications
    : allNotifications.filter(n => n.category === filter);
  const unreadCount = allNotifications.filter(n => !readIds.includes(n.id)).length;

  const handleClick = (id) => {
    if (!readIds.includes(id)) setReadIds(prev => [...prev, id]);
    setExpandedId(expandedId === id ? null : id);
  };

  const getTypeStyle = (type) => {
    const styles = {
      danger: { bg: '#FFEBEE', border: '#FFCDD2', color: '#C62828', dot: '#E53935' },
      warning: { bg: '#FFF8E1', border: '#FFE082', color: '#E65100', dot: '#FF8F00' },
      success: { bg: '#E8F5E9', border: '#A5D6A7', color: '#2E7D32', dot: '#43A047' },
      info: { bg: '#E3F2FD', border: '#90CAF9', color: '#1565C0', dot: '#1E88E5' },
    };
    return styles[type] || styles.info;
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Notifications...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 20,
                    flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
            My Notifications
            {unreadCount > 0 && (
              <span style={{ background: '#E63946', color: 'white',
                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                marginLeft: 8, fontWeight: 'bold' }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Click any notification to read full details
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchAll}
            style={{ background: '#FFF8F0', border: '1px solid #FFB800',
              color: '#3E1F00', padding: '8px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            Refresh
          </button>
          <button onClick={() => setReadIds(allNotifications.map(n => n.id))}
            style={{ background: '#FF6B35', border: 'none', color: 'white',
              padding: '8px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            Mark All Read
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: allNotifications.length, color: '#FF6B35' },
          { label: 'Unread', value: unreadCount, color: '#E63946' },
          { label: 'Sales', value: allNotifications.filter(n => n.category === 'Sales').length, color: '#2D6A4F' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 14, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 22, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', 'Sales', 'Performance', 'System'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 12, border: 'none',
              background: filter === f ? '#3E1F00' : '#FFF8F0',
              color: filter === f ? '#FFB800' : '#888' }}>
            {f}
            <span style={{ marginLeft: 5,
              background: filter === f ? '#FF6B35' : '#FFE8D0',
              color: filter === f ? 'white' : '#888',
              padding: '1px 5px', borderRadius: 10, fontSize: 10 }}>
              {f === 'All' ? allNotifications.length
                : allNotifications.filter(n => n.category === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(n => {
          const s = getTypeStyle(n.type);
          const isRead = readIds.includes(n.id);
          const isExpanded = expandedId === n.id;
          return (
            <div key={n.id} onClick={() => handleClick(n.id)}
              style={{ background: isRead ? 'white' : s.bg,
                border: `1px solid ${isExpanded ? s.color : isRead ? '#FFE8D0' : s.border}`,
                borderRadius: 12, padding: 14, cursor: 'pointer',
                boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.2s', opacity: isRead && !isExpanded ? 0.75 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                  <div style={{ fontSize: 20, minWidth: 28, textAlign: 'center' }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 'bold', color: s.color, fontSize: 14 }}>
                        {n.title}
                      </span>
                      {!isRead && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%',
                                      background: s.dot }}/>
                      )}
                    </div>
                    <div style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>
                      {n.summary}
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 10, padding: 12, background: s.bg,
                        borderRadius: 8, border: `1px solid ${s.border}`,
                        color: '#333', fontSize: 13, lineHeight: 1.8,
                        whiteSpace: 'pre-line' }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 11, color: s.color,
                                  fontWeight: 'bold' }}>
                      {isExpanded ? '▲ Collapse' : '▼ Read more'}
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ color: '#AAA', fontSize: 11 }}>{n.time}</div>
                  <span style={{ color: isRead ? '#AAA' : s.color,
                                 fontSize: 11, fontWeight: isRead ? 'normal' : 'bold' }}>
                    {isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
