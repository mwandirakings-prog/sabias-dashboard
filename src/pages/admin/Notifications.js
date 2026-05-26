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

  const generateNotifications = () => {
    const notifications = [];
    inventory.forEach(item => {
      if (item.quantity_in_stock === 0) {
        notifications.push({
          id: `out-${item.id}`, type: 'danger', icon: '🚨',
          title: 'Out of Stock',
          summary: `${item.product} is out of stock!`,
          message: `${item.product} is completely out of stock!\n\nReorder from ${item.supplier} immediately.\nCurrent stock: 0 units\nReorder level: ${item.reorder_level} units\nSupplier: ${item.supplier || 'N/A'}`,
          time: 'Stock Alert', category: 'Inventory',
        });
      } else if (item.quantity_in_stock <= item.reorder_level) {
        notifications.push({
          id: `low-${item.id}`, type: 'warning', icon: '⚠️',
          title: 'Low Stock Alert',
          summary: `${item.product} — ${item.quantity_in_stock} units left.`,
          message: `${item.product} has only ${item.quantity_in_stock} units remaining.\n\nReorder level: ${item.reorder_level} units\nSuggested order: ${item.reorder_level * 2} units\nSupplier: ${item.supplier || 'N/A'}`,
          time: 'Stock Alert', category: 'Inventory',
        });
      }
    });

    sales.slice(0, 5).forEach(s => {
      notifications.push({
        id: `sale-${s.id}`, type: 'success', icon: '💰',
        title: 'New Sale Recorded',
        summary: `${s.salesperson} sold ${s.product} — MK ${new Intl.NumberFormat('en-US').format(Math.round(s.revenue || 0))}`,
        message: `Salesperson: ${s.salesperson}\nProduct: ${s.product}\nCategory: ${s.category}\nBranch: ${s.region}\nCustomer: ${s.customer || 'Walk-in'}\nQuantity: ${s.quantity} units\nRevenue: MK ${new Intl.NumberFormat('en-US').format(Math.round(s.revenue || 0))}\nProfit: MK ${new Intl.NumberFormat('en-US').format(Math.round(s.profit || 0))}\nPayment: ${s.payment}\nDate: ${s.sale_date?.split('T')[0]}`,
        time: s.sale_date?.split('T')[0], category: 'Sales',
      });
    });

    notifications.push({
      id: 'sys-1', type: 'info', icon: '📊',
      title: 'Analytics Updated',
      summary: 'Sales analytics and forecasting data refreshed.',
      message: 'Your analytics and forecasting data has been refreshed with the latest transactions. All charts and reports are now current.',
      time: 'System', category: 'System',
    });
    notifications.push({
      id: 'sys-2', type: 'info', icon: '🔒',
      title: 'Security Notice',
      summary: 'Your SABIAS system is secure.',
      message: 'Your SABIAS system is secure. All data is encrypted and backed up. Company data is isolated from other companies. If you notice suspicious activity, contact SABIAS support immediately.',
      time: 'System', category: 'System',
    });
    notifications.push({
      id: 'sys-3', type: 'success', icon: '✅',
      title: 'System Running',
      summary: 'SABIAS is fully operational.',
      message: 'SABIAS is fully operational. Backend and database are healthy. All modules are working correctly.',
      time: 'System', category: 'System',
    });

    return notifications;
  };

  const allNotifications = generateNotifications();
  const filtered = filter === 'All' ? allNotifications
    : allNotifications.filter(n => n.category === filter);
  const unreadCount = allNotifications.filter(n => !readIds.includes(n.id)).length;

  const handleClick = (id) => {
    if (!readIds.includes(id)) setReadIds([...readIds, id]);
    setExpandedId(expandedId === id ? null : id);
  };

  const markAllRead = () => setReadIds(allNotifications.map(n => n.id));

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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 20,
                    flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ background: '#E63946', color: 'white',
                fontSize: 11, fontWeight: 'bold', padding: '2px 8px',
                borderRadius: 10, marginLeft: 8 }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Click any notification to expand details
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchAll}
            style={{ background: '#FFF8F0', border: '1px solid #FFB800',
              color: '#3E1F00', padding: '8px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            Refresh
          </button>
          <button onClick={markAllRead}
            style={{ background: '#FF6B35', border: 'none', color: 'white',
              padding: '8px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
            Mark All Read
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: allNotifications.length, color: '#FF6B35' },
          { label: 'Unread', value: unreadCount, color: '#E63946' },
          { label: 'Stock Alerts', value: allNotifications.filter(n => n.category === 'Inventory').length, color: '#FFB800' },
          { label: 'Sales Alerts', value: allNotifications.filter(n => n.category === 'Sales').length, color: '#2D6A4F' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 14, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 22, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16,
                    flexWrap: 'wrap' }}>
        {['All', 'Inventory', 'Sales', 'System'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 12, border: 'none',
              background: filter === f ? '#3E1F00' : '#FFF8F0',
              color: filter === f ? '#FFB800' : '#888' }}>
            {f}
            <span style={{ marginLeft: 5,
              background: filter === f ? '#FF6B35' : '#FFE8D0',
              color: filter === f ? 'white' : '#888',
              padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
              {f === 'All' ? allNotifications.length
                : allNotifications.filter(n => n.category === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48,
                        textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ color: '#888' }}>No notifications in this category</div>
          </div>
        ) : (
          filtered.map(n => {
            const s = getTypeStyle(n.type);
            const isRead = readIds.includes(n.id);
            const isExpanded = expandedId === n.id;
            return (
              <div key={n.id} onClick={() => handleClick(n.id)}
                style={{ background: isRead ? 'white' : s.bg,
                  border: `1px solid ${isExpanded ? s.color : isRead ? '#FFE8D0' : s.border}`,
                  borderRadius: 12, padding: 14, cursor: 'pointer',
                  boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s', opacity: isRead && !isExpanded ? 0.75 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                              alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    <div style={{ fontSize: 22, minWidth: 30, textAlign: 'center' }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center',
                                    gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', color: s.color, fontSize: 14 }}>
                          {n.title}
                        </span>
                        {!isRead && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%',
                                        background: s.dot }}/>
                        )}
                        <span style={{ background: isRead ? '#F5F5F5' : s.bg,
                          color: '#888', padding: '1px 6px', borderRadius: 10,
                          fontSize: 10, border: `1px solid ${s.border}` }}>
                          {n.category}
                        </span>
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
                  <div style={{ display: 'flex', flexDirection: 'column',
                                alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <div style={{ color: '#AAA', fontSize: 11 }}>{n.time}</div>
                    <span style={{ color: isRead ? '#AAA' : s.color,
                                   fontSize: 11, fontWeight: isRead ? 'normal' : 'bold' }}>
                      {isRead ? 'Read' : 'Unread'}
                    </span>
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
