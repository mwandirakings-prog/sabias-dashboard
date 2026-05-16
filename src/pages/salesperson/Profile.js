import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Profile({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: ''
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchSales = useCallback(async () => {
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

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      alert('New passwords do not match!');
      return;
    }
    setPasswords({ current: '', newPass: '', confirm: '' });
    showSuccess('Password changed successfully!');
  };

  // My stats
  const mySales = sales.filter(s => s.salesperson === user?.name);
  const myRevenue = mySales.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
  const myProfit = mySales.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);
  const myUnits = mySales.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
  const myMargin = myRevenue > 0 ? ((myProfit / myRevenue) * 100).toFixed(1) : 0;

  // Top product
  const productMap = mySales.reduce((acc, s) => {
    if (!acc[s.product]) acc[s.product] = 0;
    acc[s.product] += parseFloat(s.revenue || 0);
    return acc;
  }, {});
  const topProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1])[0];

  // Best region
  const regionMap = mySales.reduce((acc, s) => {
    if (!acc[s.region]) acc[s.region] = 0;
    acc[s.region] += parseFloat(s.revenue || 0);
    return acc;
  }, {});
  const bestRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0];

  const tabs = [
    { id: 'profile', label: '👤 My Profile' },
    { id: 'performance', label: '📊 My Performance' },
    { id: 'password', label: '🔒 Change Password' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Profile...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>My Profile</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          View your profile and sales performance
        </p>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

        {/* Sidebar */}
        <div>
          {/* Avatar Card */}
          <div style={{ background: 'white', borderRadius: 12, padding: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        textAlign: 'center', marginBottom: 12 }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%',
                          background: '#FF6B35', color: 'white',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 28,
                          fontWeight: 'bold', margin: '0 auto 12px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: 'bold', color: '#3E1F00',
                          fontSize: 15 }}>{user?.name}</div>
            <div style={{ color: '#888', fontSize: 12,
                          marginTop: 4 }}>{user?.email}</div>
            <span style={{ display: 'inline-block', marginTop: 8,
                           background: '#FFB800', color: '#3E1F00',
                           padding: '3px 12px', borderRadius: 10,
                           fontSize: 11, fontWeight: 'bold',
                           textTransform: 'capitalize' }}>
              {user?.role}
            </span>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              📍 {user?.region}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background: 'white', borderRadius: 12, padding: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  marginBottom: 4, fontWeight: 'bold', fontSize: 13,
                  background: activeTab === tab.id ? '#3E1F00' : 'transparent',
                  color: activeTab === tab.id ? '#FFB800' : '#888',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ background: 'white', borderRadius: 12, padding: 28,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>My Information</h3>
              <div style={{ display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: 16,
                            marginBottom: 24 }}>
                {[
                  { label: 'Full Name', value: user?.name },
                  { label: 'Email Address', value: user?.email },
                  { label: 'Role', value: user?.role },
                  { label: 'Region', value: user?.region },
                  { label: 'Total Sales Made', value: mySales.length },
                  { label: 'Total Revenue', value: `MK ${fmt(myRevenue)}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#FFF8F0',
                    borderRadius: 10, padding: 16,
                    border: '1px solid #FFE8D0' }}>
                    <div style={{ fontSize: 11, color: '#888',
                                  marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                  fontSize: 14, textTransform:
                                  label === 'Role' ? 'capitalize' : 'none' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Sales */}
              <h3 style={{ color: '#3E1F00' }}>My Recent Sales</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse',
                                fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#3E1F00' }}>
                      {['Date','Product','Region','Qty',
                        'Revenue','Payment'].map(h => (
                        <th key={h} style={{ padding: '10px 12px',
                          color: '#FFB800', textAlign: 'left',
                          whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mySales.slice(0, 8).map((s, i) => (
                      <tr key={s.id} style={{
                        background: i % 2 === 0 ? '#FFF8F0' : 'white',
                        borderBottom: '1px solid #FFE8D0' }}>
                        <td style={{ padding: '8px 12px' }}>
                          {s.sale_date?.split('T')[0]}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: '500',
                                     color: '#3E1F00' }}>{s.product}</td>
                        <td style={{ padding: '8px 12px' }}>{s.region}</td>
                        <td style={{ padding: '8px 12px',
                                     textAlign: 'right' }}>{s.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right',
                                     color: '#2D6A4F', fontWeight: '500' }}>
                          MK {fmt(s.revenue)}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            background: s.payment === 'Cash' ? '#E8F5E9' :
                                        s.payment === 'Mobile Money' ? '#E3F2FD' : '#FFF3E0',
                            color: s.payment === 'Cash' ? '#2E7D32' :
                                   s.payment === 'Mobile Money' ? '#1565C0' : '#E65100',
                            padding: '2px 8px', borderRadius: 10, fontSize: 11
                          }}>
                            {s.payment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>My Performance</h3>
              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Transactions', value: mySales.length,
                    color: '#FF6B35', icon: '🧾' },
                  { label: 'Total Revenue', value: `MK ${fmt(myRevenue)}`,
                    color: '#2D6A4F', icon: '💰' },
                  { label: 'Total Profit', value: `MK ${fmt(myProfit)}`,
                    color: '#FFB800', icon: '📈' },
                  { label: 'Profit Margin', value: `${myMargin}%`,
                    color: '#457B9D', icon: '📊' },
                  { label: 'Units Sold', value: fmt(myUnits),
                    color: '#9B5DE5', icon: '📦' },
                  { label: 'Top Product', value: topProduct?.[0] || 'N/A',
                    color: '#E63946', icon: '🥇' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ background: 'white',
                    borderRadius: 12, padding: 20,
                    borderLeft: `4px solid ${color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                    <div style={{ color: '#888', fontSize: 12,
                                  marginBottom: 4 }}>{label}</div>
                    <div style={{ color: '#3E1F00', fontSize: 16,
                                  fontWeight: 'bold' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Best Region */}
              {bestRegion && (
                <div style={{ background: '#3E1F00', borderRadius: 12,
                              padding: 20, color: 'white', marginBottom: 16 }}>
                  <div style={{ color: '#FFB800', fontWeight: 'bold',
                                fontSize: 15, marginBottom: 8 }}>
                    🌍 Best Performing Region
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 'bold' }}>
                    {bestRegion[0]}
                  </div>
                  <div style={{ color: '#FFB800', fontSize: 14, marginTop: 4 }}>
                    MK {fmt(bestRegion[1])} in revenue
                  </div>
                </div>
              )}

              {/* Achievement Badges */}
              <h3 style={{ color: '#3E1F00' }}>🏅 Achievement Badges</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'First Sale', earned: mySales.length >= 1,
                    icon: '🎯', desc: 'Recorded first sale' },
                  { label: 'Sales Star', earned: mySales.length >= 10,
                    icon: '⭐', desc: '10+ sales recorded' },
                  { label: 'Top Earner', earned: myRevenue >= 500000,
                    icon: '🏆', desc: 'MK 500K+ revenue' },
                  { label: 'Consistent', earned: mySales.length >= 5,
                    icon: '💪', desc: '5+ sales made' },
                ].map(({ label, earned, icon, desc }) => (
                  <div key={label} style={{
                    background: earned ? '#FFF8F0' : '#F5F5F5',
                    border: `2px solid ${earned ? '#FFB800' : '#DDD'}`,
                    borderRadius: 12, padding: 16, textAlign: 'center',
                    minWidth: 100, opacity: earned ? 1 : 0.5 }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                  fontSize: 12 }}>{label}</div>
                    <div style={{ color: '#888', fontSize: 10,
                                  marginTop: 2 }}>{desc}</div>
                    {earned && (
                      <div style={{ color: '#2E7D32', fontSize: 10,
                                    fontWeight: 'bold', marginTop: 4 }}>
                        ✓ Earned!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>Change Password</h3>
              <form onSubmit={handlePasswordSave} style={{ maxWidth: 400 }}>
                {[
                  { label: 'Current Password', key: 'current' },
                  { label: 'New Password', key: 'newPass' },
                  { label: 'Confirm New Password', key: 'confirm' },
                ].map(({ label, key }) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 6 }}>{label}</label>
                    <input type="password" required
                      value={passwords[key]}
                      onChange={(e) => setPasswords({
                        ...passwords, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                ))}
                <div style={{ background: '#FFF8F0', borderRadius: 8,
                              padding: 12, marginBottom: 16,
                              fontSize: 12, color: '#888' }}>
                  💡 Password must be at least 8 characters with uppercase and numbers
                </div>
                <button type="submit"
                  style={{ background: '#FF6B35', border: 'none',
                           color: 'white', padding: '10px 28px',
                           borderRadius: 8, cursor: 'pointer',
                           fontWeight: 'bold', fontSize: 14 }}>
                  Change Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}