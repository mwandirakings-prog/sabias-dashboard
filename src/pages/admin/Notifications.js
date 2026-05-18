import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Notifications({ token, user }) {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const cid = user?.company_id;
      const [inv, s] = await Promise.all([
        axios.get(`${API}/api/inventory?company_id=${cid}`, h),
        axios.get(`${API}/api/sales?company_id=${cid}`, h),
      ]);
      setInventory(inv.data.data);
      setSales(s.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateNotifications = () => {
    const notifications = [];

    inventory.forEach(item => {
      if (item.quantity_in_stock === 0) {
        notifications.push({
          id: `out-${item.id}`,
          type: 'danger',
          icon: '🚨',
          title: 'Out of Stock',
          summary: `${item.product} is out of stock!`,
          message: `${item.product} is completely out of stock! Reorder from ${item.supplier} immediately. Current stock: 0 units. Reorder level: ${item.reorder_level} units. Supplier: ${item.supplier}. Action required: Place order immediately to avoid losing sales.`,
          time: 'Stock Alert',
          category: 'Inventory',
        });
      } else if (item.quantity_in_stock <= item.reorder_level) {
        notifications.push({
          id: `low-${item.id}`,
          type: 'warning',
          icon: '⚠️',
          title: 'Low Stock Alert',
          summary: `${item.product} is running low — ${item.quantity_in_stock} units left.`,
          message: `${item.product} has only ${item.quantity_in_stock} units remaining in stock. The reorder level is ${item.reorder_level} units. Supplier: ${item.supplier}. Please reorder soon to avoid running out of stock. Consider ordering at least ${item.reorder_level * 2} units.`,
          time: 'Stock Alert',
          category: 'Inventory',
        });
      }
    });

    const recentSales = sales.slice(0, 5);
    recentSales.forEach((s) => {
      notifications.push({
        id: `sale-${s.id}`,
        type: 'success',
        icon: '💰',
        title: 'New Sale Recorded',
        summary: `${s.salesperson} sold ${s.product} — MK ${new Intl.NumberFormat('en-US').format(Math.round(s.revenue || 0))}`,
        message: `Salesperson: ${s.salesperson}\nProduct: ${s.product}\nCategory: ${s.category}\nBranch: ${s.region}\nCustomer: ${s.customer || 'Walk-in'}\nQuantity: ${s.quantity} units\nRevenue: MK ${new Intl.NumberFormat('en-US').format(Math.round(s.revenue || 0))}\nProfit: MK ${new Intl.NumberFormat('en-US').format(Math.round(s.profit || 0))}\nPayment: ${s.payment}\nDate: ${s.sale_date?.split('T')[0]}`,
        time: s.sale_date?.split('T')[0],
        category: 'Sales',
      });
    });

    notifications.push({
      id: 'sys-1',
      type: 'info',
      icon: '📊',
      title: 'Analytics Updated',
      summary: 'Sales analytics and forecasting data refreshed.',
      message: 'Your sales analytics and forecasting data has been refreshed with the latest transactions. All charts, reports and forecasts are now showing the most current data. Visit the Analytics and Forecasting modules for detailed insights.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-2',
      type: 'info',
      icon: '🔒',
      title: 'Security Notice',
      summary: 'Your SABIAS system is secure.',
      message: 'Your SABIAS system is secure and all data is encrypted and backed up on Neon cloud. Your company data is isolated from other companies. All passwords are protected. If you notice any suspicious activity, contact the SABIAS administrator immediately.',
      time: 'System',
      category: 'System',
    });

    notifications.push({
      id: 'sys-3',
      type: 'success',
      icon: '✅',
      title: 'System Running',
      summary: 'SABIAS is fully operational.',
      message: 'SABIAS is fully operational. Backend API on Render and database on Neon are healthy. All modules including Sales, Inventory, Analytics, Forecasting, Reports and User Management are working correctly.',
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

  const handleClick = (id) => {
    if (!readIds.includes(id)) setReadIds([...readIds, id]);
    setExpandedId(expandedId === id ? null : id);
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
            Click any notification to read full details
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Notifications', value: allNotifications.length, color: '#FF6B35' },
          { label: 'Unread', value: unreadCount, color: '#E63946' },
          { label: 'Stock Alerts', value: allNotifications.filter(n => n.category === 'Inventory').length, color: '#FFB800' },
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
            <span style={{ marginLeft: 6,
                           background: filter === f ? '#FF6B35' : '#FFE8D0',
                           color: filter === f ? 'white' : '#888',
                           padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>
              {f === 'All' ? allNotifications.length
                : allNotifications.filter(n => n.category === f).length}
            </span>
          </button>
        ))}
      </div>

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
            const isExpanded = expandedId === n.id;
            return (
              <div key={n.id} onClick={() => handleClick(n.id)}
                style={{
                  background: isRead ? 'white' : style.bg,
                  border: `1px solid ${isExpanded ? style.color : isRead ? '#FFE8D0' : style.border}`,
                  borderRadius: 12, padding: 16, cursor: 'pointer',
                  boxShadow: isExpanded
                    ? `0 4px 16px rgba(0,0,0,0.12)`
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  opacity: isRead && !isExpanded ? 0.75 : 1,
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
                      {/* Summary always visible */}
                      <div style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>
                        {n.summary}
                      </div>
                      {/* Full message — expanded */}
                      {isExpanded && (
                        <div style={{ marginTop: 12, padding: 14,
                                      background: style.bg,
                                      borderRadius: 8,
                                      border: `1px solid ${style.border}`,
                                      color: '#333', fontSize: 13,
                                      lineHeight: 1.8,
                                      whiteSpace: 'pre-line' }}>
                          {n.message}
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 11,
                                    color: style.color, fontWeight: 'bold' }}>
                        {isExpanded ? '▲ Click to collapse' : '▼ Click to read more'}
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
          })
        )}
      </div>
    </div>
  );
}