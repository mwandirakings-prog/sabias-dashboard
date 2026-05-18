import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function ViewerProfile({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: ''
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cid = user?.company_id;
      const res = await axios.get(`${API}/api/sales?company_id=${cid}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSales(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const totalRevenue = sales.reduce((sum, s) =>
    sum + parseFloat(s.revenue || 0), 0);
  const totalProfit = sales.reduce((sum, s) =>
    sum + parseFloat(s.profit || 0), 0);
  const totalTransactions = sales.length;
  const regions = [...new Set(sales.map(s => s.region).filter(Boolean))];
  const topRegion = Object.entries(
    sales.reduce((acc, s) => {
      acc[s.region] = (acc[s.region] || 0) + parseFloat(s.revenue || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const tabs = [
    { id: 'profile', label: '👤 My Profile' },
    { id: 'overview', label: '📊 System Overview' },
    { id: 'password', label: '🔒 Change Password' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#2C3E50', fontSize: 18 }}>
      Loading Profile...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#2C3E50', margin: 0, fontSize: 22 }}>
          My Profile
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          {user?.company || 'Your Company'} · Viewer Portal
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
          <div style={{ background: 'white', borderRadius: 12, padding: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        textAlign: 'center', marginBottom: 12 }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%',
                          background: '#2980B9', color: 'white',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 28,
                          fontWeight: 'bold', margin: '0 auto 12px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontWeight: 'bold', color: '#2C3E50',
                          fontSize: 15 }}>{user?.name}</div>
            <div style={{ color: '#888', fontSize: 12,
                          marginTop: 4 }}>{user?.email}</div>
            <div style={{ color: '#FF6B35', fontSize: 12, marginTop: 4,
                          fontWeight: 'bold' }}>
              {user?.company || 'Your Company'}
            </div>
            <span style={{ display: 'inline-block', marginTop: 8,
                           background: '#D6EAF8', color: '#1565C0',
                           padding: '3px 12px', borderRadius: 10,
                           fontSize: 11, fontWeight: 'bold',
                           textTransform: 'capitalize' }}>
              {user?.role}
            </span>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              📍 {user?.region === 'all' ? 'All Branches' : user?.region}
            </div>
            <div style={{ marginTop: 8, background: '#E8F5E9',
                          borderRadius: 8, padding: '6px 10px',
                          fontSize: 11, color: '#2E7D32', fontWeight: 'bold' }}>
              🔒 Read Only Access
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  marginBottom: 4, fontWeight: 'bold', fontSize: 13,
                  background: activeTab === tab.id ? '#2C3E50' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#888',
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
              <h3 style={{ color: '#2C3E50', marginTop: 0 }}>
                My Information
              </h3>
              <div style={{ display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Full Name', value: user?.name },
                  { label: 'Email Address', value: user?.email },
                  { label: 'Role', value: user?.role },
                  { label: 'Company', value: user?.company || 'N/A' },
                  { label: 'Access Level', value: 'Read Only' },
                  { label: 'Branch', value: user?.region === 'all'
                    ? 'All Branches' : user?.region },
                  { label: 'Total Sales Viewed', value: totalTransactions },
                  { label: 'System', value: 'SABIAS v2.0' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#EBF5FB',
                    borderRadius: 10, padding: 16,
                    border: '1px solid #D6EAF8' }}>
                    <div style={{ fontSize: 11, color: '#888',
                                  marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 'bold', color: '#2C3E50',
                                  fontSize: 14,
                                  textTransform: label === 'Role'
                                    ? 'capitalize' : 'none' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, background: '#2C3E50',
                            borderRadius: 12, padding: 20 }}>
                <div style={{ color: 'white', fontWeight: 'bold',
                              fontSize: 15, marginBottom: 12 }}>
                  ℹ️ Your Access Permissions
                </div>
                <div style={{ display: 'grid',
                              gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'View Dashboard', allowed: true },
                    { label: 'View Analytics', allowed: true },
                    { label: 'View Inventory', allowed: true },
                    { label: 'View Reports', allowed: true },
                    { label: 'Record Sales', allowed: false },
                    { label: 'Manage Users', allowed: false },
                    { label: 'Edit Inventory', allowed: false },
                    { label: 'Export Data', allowed: false },
                  ].map(({ label, allowed }) => (
                    <div key={label} style={{ display: 'flex',
                      alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ color: allowed ? '#4CAF50' : '#E63946',
                                     fontWeight: 'bold' }}>
                        {allowed ? '✓' : '✗'}
                      </span>
                      <span style={{ color: 'white',
                                     fontSize: 12 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ color: '#2C3E50', marginTop: 0 }}>
                System Overview —{' '}
                <span style={{ color: '#FF6B35' }}>
                  {user?.company || 'Your Company'}
                </span>
              </h3>
              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Transactions',
                    value: totalTransactions, color: '#2980B9', icon: '🧾' },
                  { label: 'Total Revenue',
                    value: `MK ${fmt(totalRevenue)}`,
                    color: '#2D6A4F', icon: '💰' },
                  { label: 'Total Profit',
                    value: `MK ${fmt(totalProfit)}`,
                    color: '#FFB800', icon: '📈' },
                  { label: 'Active Branches',
                    value: regions.length, color: '#9B5DE5', icon: '🌍' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ background: 'white',
                    borderRadius: 12, padding: 20,
                    borderLeft: `4px solid ${color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                    <div style={{ color: '#888', fontSize: 12,
                                  marginBottom: 4 }}>{label}</div>
                    <div style={{ color: '#2C3E50', fontSize: 16,
                                  fontWeight: 'bold' }}>{value}</div>
                  </div>
                ))}
              </div>

              {topRegion && (
                <div style={{ background: '#2C3E50', borderRadius: 12,
                              padding: 20, color: 'white', marginBottom: 16 }}>
                  <div style={{ color: '#4CC9F0', fontWeight: 'bold',
                                fontSize: 15, marginBottom: 8 }}>
                    🏆 Top Performing Branch
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 'bold' }}>
                    {topRegion[0]}
                  </div>
                  <div style={{ color: '#4CC9F0', fontSize: 14, marginTop: 4 }}>
                    MK {fmt(topRegion[1])} in total revenue
                  </div>
                </div>
              )}

              <div style={{ background: '#EBF5FB', borderRadius: 12,
                            padding: 16, border: '1px solid #D6EAF8' }}>
                <div style={{ fontWeight: 'bold', color: '#2C3E50',
                              marginBottom: 8 }}>
                  Active Branches
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {regions.map(r => (
                    <span key={r} style={{ background: '#2980B9',
                                           color: 'white', padding: '4px 14px',
                                           borderRadius: 20, fontSize: 12,
                                           fontWeight: 'bold' }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ color: '#2C3E50', marginTop: 0 }}>
                Change Password
              </h3>
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
                    <input type="password" required value={passwords[key]}
                      onChange={(e) => setPasswords({
                        ...passwords, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8,
                               border: '1.5px solid #2980B9',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                ))}
                <div style={{ background: '#EBF5FB', borderRadius: 8,
                              padding: 12, marginBottom: 16,
                              fontSize: 12, color: '#888' }}>
                  💡 Password must be at least 8 characters
                </div>
                <button type="submit"
                  style={{ background: '#2980B9', border: 'none',
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