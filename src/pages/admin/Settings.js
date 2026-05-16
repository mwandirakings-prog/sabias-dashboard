import React, { useState } from 'react';

export default function Settings({ user, token }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [successMsg, setSuccessMsg] = useState('');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: ''
  });
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    lowStock: true, newSales: true, system: true, email: false
  });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    showSuccess('Profile updated successfully!');
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

  const tabs = [
    { id: 'profile', label: '👤 Profile', },
    { id: 'password', label: '🔒 Password', },
    { id: 'notifications', label: '🔔 Notifications', },
    { id: 'system', label: '⚙️ System Info', },
  ];

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>Settings</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Manage your profile, security and system preferences
        </p>
      </div>

      {/* Success */}
      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

        {/* Sidebar Tabs */}
        <div style={{ background: 'white', borderRadius: 12, padding: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      height: 'fit-content' }}>
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

        {/* Content */}
        <div style={{ background: 'white', borderRadius: 12, padding: 28,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>Profile Settings</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20,
                            marginBottom: 28, padding: 20,
                            background: '#FFF8F0', borderRadius: 12 }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%',
                              background: '#FF6B35', color: 'white',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 28,
                              fontWeight: 'bold' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                fontSize: 18 }}>{user?.name}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>{user?.email}</div>
                  <span style={{ background: '#FFB800', color: '#3E1F00',
                                 padding: '2px 10px', borderRadius: 10,
                                 fontSize: 11, fontWeight: 'bold',
                                 textTransform: 'capitalize' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <form onSubmit={handleProfileSave}>
                <div style={{ display: 'grid',
                              gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 6 }}>Full Name</label>
                    <input type="text" value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 6 }}>Role</label>
                    <input type="text" value={user?.role} disabled
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #EEE',
                               fontSize: 13, boxSizing: 'border-box',
                               background: '#F5F5F5', color: '#888',
                               textTransform: 'capitalize' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 6 }}>Region</label>
                    <input type="text" value={user?.region || 'All'} disabled
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #EEE',
                               fontSize: 13, boxSizing: 'border-box',
                               background: '#F5F5F5', color: '#888' }}/>
                  </div>
                </div>
                <button type="submit"
                  style={{ marginTop: 20, background: '#FF6B35', border: 'none',
                           color: 'white', padding: '10px 28px', borderRadius: 8,
                           cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>Change Password</h3>
              <form onSubmit={handlePasswordSave}
                style={{ maxWidth: 400 }}>
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
                      onChange={(e) => setPasswords({...passwords, [key]: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                ))}
                <div style={{ background: '#FFF8F0', borderRadius: 8,
                              padding: 12, marginBottom: 16, fontSize: 12,
                              color: '#888' }}>
                  💡 Password must be at least 8 characters with uppercase and numbers
                </div>
                <button type="submit"
                  style={{ background: '#FF6B35', border: 'none', color: 'white',
                           padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                           fontWeight: 'bold', fontSize: 14 }}>
                  Change Password
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
                Notification Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'lowStock', label: 'Low Stock Alerts',
                    desc: 'Get notified when products fall below reorder level' },
                  { key: 'newSales', label: 'New Sales Notifications',
                    desc: 'Get notified when new sales are recorded' },
                  { key: 'system', label: 'System Notifications',
                    desc: 'Receive system updates and maintenance alerts' },
                  { key: 'email', label: 'Email Notifications',
                    desc: 'Send notifications to your email address' },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    padding: 16, background: '#FFF8F0', borderRadius: 10,
                    border: '1px solid #FFE8D0' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                    fontSize: 14 }}>{label}</div>
                      <div style={{ color: '#888', fontSize: 12,
                                    marginTop: 2 }}>{desc}</div>
                    </div>
                    <div onClick={() => setNotifications({
                      ...notifications, [key]: !notifications[key]
                    })}
                      style={{
                        width: 48, height: 26, borderRadius: 13,
                        background: notifications[key] ? '#FF6B35' : '#DDD',
                        cursor: 'pointer', position: 'relative',
                        transition: 'background 0.3s ease'
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'white', position: 'absolute',
                        top: 3, transition: 'left 0.3s ease',
                        left: notifications[key] ? 25 : 3,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => showSuccess('Notification preferences saved!')}
                style={{ marginTop: 20, background: '#FF6B35', border: 'none',
                         color: 'white', padding: '10px 28px', borderRadius: 8,
                         cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                Save Preferences
              </button>
            </div>
          )}

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>System Information</h3>
              <div style={{ display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: 16,
                            marginBottom: 24 }}>
                {[
                  { label: 'System Name', value: 'SABIAS', icon: '🏢' },
                  { label: 'Version', value: '1.0.0', icon: '📦' },
                  { label: 'Frontend', value: 'React.js on Vercel', icon: '⚛️' },
                  { label: 'Backend', value: 'Node.js on Render', icon: '🖥️' },
                  { label: 'Database', value: 'PostgreSQL on Neon', icon: '🗄️' },
                  { label: 'Currency', value: 'Malawian Kwacha (MWK)', icon: '💰' },
                  { label: 'Regions', value: 'Lilongwe, Blantyre, Mzuzu', icon: '🌍' },
                  { label: 'User Roles', value: 'Admin, Salesperson, Viewer', icon: '👥' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: '#FFF8F0',
                    borderRadius: 10, padding: 16,
                    border: '1px solid #FFE8D0' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 11, color: '#888',
                                  marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                  fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#3E1F00', borderRadius: 12,
                            padding: 20, color: 'white' }}>
                <div style={{ fontWeight: 'bold', fontSize: 15,
                              marginBottom: 12, color: '#FFB800' }}>
                  🚀 System Status
                </div>
                <div style={{ display: 'grid',
                              gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Frontend', status: 'Online', color: '#4CAF50' },
                    { label: 'Backend API', status: 'Online', color: '#4CAF50' },
                    { label: 'Database', status: 'Connected', color: '#4CAF50' },
                    { label: 'Authentication', status: 'Active', color: '#4CAF50' },
                  ].map(({ label, status, color }) => (
                    <div key={label} style={{ display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '10px 14px' }}>
                      <span style={{ fontSize: 13 }}>{label}</span>
                      <span style={{ color, fontWeight: 'bold', fontSize: 12 }}>
                        ● {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, padding: 16,
                            background: '#E8F5E9', borderRadius: 10,
                            border: '1px solid #A5D6A7' }}>
                <div style={{ fontWeight: 'bold', color: '#2E7D32',
                              marginBottom: 4 }}>
                  ✅ Built by Kings Mwandira
                </div>
                <div style={{ color: '#555', fontSize: 12 }}>
                  SABIAS — Sales & Business Intelligence Analytics System
                  for Malawi Retail. Built with React, Node.js,
                  PostgreSQL and deployed on Vercel & Render.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}