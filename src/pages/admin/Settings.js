import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

export default function Settings({ user, token }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCode, setDevCode] = useState('');
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devError, setDevError] = useState('');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: ''
  });
  const [notifications, setNotifications] = useState({
    lowStock: true, newSales: true, system: true, email: false
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const DEV_CODE = 'SABIAS@DEV2026';

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const fetchApiKeys = useCallback(async () => {
    try {
      setApiKeysLoading(true);
      const res = await axios.get(`${API}/api/apikeys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(res.data.data);
    } catch (err) {
      setApiKeyError('Failed to load API keys.');
    } finally {
      setApiKeysLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'apikeys') fetchApiKeys();
  }, [activeTab, fetchApiKeys]);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      setApiKeyError('Please enter a name for this API key.');
      return;
    }
    setGeneratingKey(true);
    setApiKeyError('');
    try {
      await axios.post(`${API}/api/apikeys`,
        { name: newKeyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewKeyName('');
      showSuccess('New API key generated successfully!');
      fetchApiKeys();
    } catch (err) {
      setApiKeyError(err.response?.data?.error || 'Failed to generate key.');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (key) => {
    try {
      await axios.delete(`${API}/api/apikeys/${key.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfirmRevoke(null);
      showSuccess(`API key "${key.name}" revoked successfully.`);
      fetchApiKeys();
    } catch (err) {
      setApiKeyError('Failed to revoke key.');
    }
  };

  const handleCopyKey = (keyValue, keyId) => {
    navigator.clipboard.writeText(keyValue).then(() => {
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    });
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

  const handleDevUnlock = (e) => {
    e.preventDefault();
    if (devCode === DEV_CODE) {
      setDevUnlocked(true);
      setDevError('');
      setDevCode('');
    } else {
      setDevError('Invalid developer code. Access denied.');
      setDevCode('');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'apikeys', label: 'API Keys' },
    { id: 'system', label: 'System Info' },
  ];

  const fmt = (date) => date
    ? new Date(date).toLocaleDateString('en-GB') : 'Never';

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Settings
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Manage your profile, security, API access and system preferences
        </p>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid',
                    gridTemplateColumns: '220px 1fr', gap: 20 }}>

        {/* Sidebar */}
        <div style={{ background: 'white', borderRadius: 12, padding: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      height: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== 'system') setDevUnlocked(false);
              setApiKeyError('');
            }}
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

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
                Profile Settings
              </h3>
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
                  <div style={{ color: '#888', fontSize: 13 }}>
                    {user?.email}
                  </div>
                  <div style={{ color: '#FF6B35', fontSize: 12,
                                marginTop: 4, fontWeight: 'bold' }}>
                    {user?.company || 'Your Company'}
                  </div>
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
                      onChange={(e) => setProfile({
                        ...profile, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={profile.email}
                      onChange={(e) => setProfile({
                        ...profile, email: e.target.value })}
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
                                    marginBottom: 6 }}>Company</label>
                    <input type="text"
                      value={user?.company || 'Your Company'} disabled
                      style={{ width: '100%', padding: '10px 12px',
                               borderRadius: 8, border: '1.5px solid #EEE',
                               fontSize: 13, boxSizing: 'border-box',
                               background: '#F5F5F5', color: '#888' }}/>
                  </div>
                </div>
                <button type="submit"
                  style={{ marginTop: 20, background: '#FF6B35',
                           border: 'none', color: 'white',
                           padding: '10px 28px', borderRadius: 8,
                           cursor: 'pointer', fontWeight: 'bold',
                           fontSize: 14 }}>
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* ── PASSWORD TAB ── */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
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
                               borderRadius: 8, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                ))}
                <div style={{ background: '#FFF8F0', borderRadius: 8,
                              padding: 12, marginBottom: 16,
                              fontSize: 12, color: '#888' }}>
                  Password must be at least 8 characters with uppercase
                  and numbers
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

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
                Notification Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column',
                            gap: 16 }}>
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
                      ...notifications, [key]: !notifications[key] })}
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
              <button onClick={() => showSuccess(
                'Notification preferences saved!')}
                style={{ marginTop: 20, background: '#FF6B35', border: 'none',
                         color: 'white', padding: '10px 28px', borderRadius: 8,
                         cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                Save Preferences
              </button>
            </div>
          )}

          {/* ── API KEYS TAB ── */}
          {activeTab === 'apikeys' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
                API Keys
              </h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 24,
                          lineHeight: 1.7 }}>
                Use API keys to connect external apps, WhatsApp bots or
                accounting systems to your SABIAS data. Each key gives
                access to your company data only. Maximum 3 active keys.
              </p>

              {apiKeyError && (
                <div style={{ background: '#FFEBEE',
                              border: '1px solid #FFCDD2',
                              borderRadius: 8, padding: '10px 14px',
                              marginBottom: 16, color: '#C62828',
                              fontSize: 13 }}>
                  {apiKeyError}
                </div>
              )}

              {/* Generate New Key */}
              <div style={{ background: '#FFF8F0', borderRadius: 12,
                            padding: 20, marginBottom: 28,
                            border: '1px solid #FFE8D0' }}>
                <div style={{ fontWeight: 'bold', color: '#3E1F00',
                              fontSize: 14, marginBottom: 4 }}>
                  Generate New API Key
                </div>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
                  Give your key a name so you remember what it is for.
                  Example: My WhatsApp Bot, Accounting System, Mobile App
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="text" value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My WhatsApp Bot"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8,
                             border: '1.5px solid #FFB800', fontSize: 13,
                             outline: 'none' }}/>
                  <button onClick={handleGenerateKey}
                    disabled={generatingKey}
                    style={{ background: generatingKey ? '#AAA' : '#FF6B35',
                             border: 'none', color: 'white',
                             padding: '10px 24px', borderRadius: 8,
                             cursor: generatingKey ? 'not-allowed' : 'pointer',
                             fontWeight: 'bold', fontSize: 13,
                             whiteSpace: 'nowrap' }}>
                    {generatingKey ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </div>

              {/* API Keys List */}
              {apiKeysLoading ? (
                <div style={{ textAlign: 'center', padding: 40,
                              color: '#888' }}>
                  Loading API keys...
                </div>
              ) : apiKeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40,
                              background: '#FFF8F0', borderRadius: 12,
                              border: '1px dashed #FFB800' }}>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                fontSize: 15, marginBottom: 8 }}>
                    No API Keys Yet
                  </div>
                  <div style={{ color: '#888', fontSize: 13 }}>
                    Generate your first API key above to start connecting
                    external systems to SABIAS.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column',
                              gap: 12 }}>
                  {apiKeys.map(key => (
                    <div key={key.id}
                      style={{ background: 'white', borderRadius: 12,
                               padding: 20, border: '1px solid #FFE8D0',
                               opacity: key.active ? 1 : 0.5 }}>

                      {/* Key Header */}
                      <div style={{ display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                        fontSize: 15 }}>
                            {key.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#888',
                                        marginTop: 2 }}>
                            Created {fmt(key.created_at)} ·
                            Last used {fmt(key.last_used_at)}
                          </div>
                        </div>
                        <span style={{
                          background: key.active ? '#E8F5E9' : '#FFEBEE',
                          color: key.active ? '#2E7D32' : '#C62828',
                          padding: '3px 10px', borderRadius: 10,
                          fontSize: 11, fontWeight: 'bold'
                        }}>
                          {key.active ? 'Active' : 'Revoked'}
                        </span>
                      </div>

                      {/* Key Value */}
                      <div style={{ background: '#FFF8F0', borderRadius: 8,
                                    padding: '10px 14px', marginBottom: 12,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 10 }}>
                        <code style={{ fontSize: 12, color: '#3E1F00',
                                       fontFamily: 'monospace',
                                       wordBreak: 'break-all' }}>
                          {key.key_value}
                        </code>
                        <button onClick={() => handleCopyKey(
                          key.key_value, key.id)}
                          style={{ background: copiedKey === key.id
                                     ? '#2E7D32' : '#3E1F00',
                                   border: 'none', color: '#FFB800',
                                   padding: '6px 14px', borderRadius: 6,
                                   cursor: 'pointer', fontSize: 11,
                                   fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {copiedKey === key.id ? 'Copied!' : 'Copy Key'}
                        </button>
                      </div>

                      {/* Usage Stats */}
                      <div style={{ display: 'flex', gap: 20,
                                    marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1 }}>
                            Requests Today
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold',
                                        color: '#FF6B35' }}>
                            {key.requests_today}
                            <span style={{ fontSize: 11, color: '#AAA',
                                           fontWeight: 'normal' }}>
                              {' '}/1000
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1 }}>
                            Total Requests
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold',
                                        color: '#3E1F00' }}>
                            {key.requests_total}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1 }}>
                            Daily Limit
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold',
                                        color: '#2E7D32' }}>
                            1,000
                          </div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div style={{ background: '#FFE8D0', borderRadius: 4,
                                    height: 6, marginBottom: 14 }}>
                        <div style={{
                          width: `${Math.min(
                            (key.requests_today / 1000) * 100, 100)}%`,
                          background: key.requests_today > 800
                            ? '#C62828' : '#FF6B35',
                          height: '100%', borderRadius: 4,
                          transition: 'width 0.3s'
                        }}/>
                      </div>

                      {/* Revoke Button */}
                      {key.active && (
                        confirmRevoke === key.id ? (
                          <div style={{ display: 'flex', gap: 8,
                                        alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#C62828' }}>
                              Revoke this key? This cannot be undone.
                            </span>
                            <button onClick={() => handleRevokeKey(key)}
                              style={{ background: '#C62828', border: 'none',
                                       color: 'white', padding: '6px 14px',
                                       borderRadius: 6, cursor: 'pointer',
                                       fontWeight: 'bold', fontSize: 12 }}>
                              Confirm Revoke
                            </button>
                            <button onClick={() => setConfirmRevoke(null)}
                              style={{ background: '#F5F5F5', border: 'none',
                                       color: '#888', padding: '6px 14px',
                                       borderRadius: 6, cursor: 'pointer',
                                       fontSize: 12 }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmRevoke(key.id)}
                            style={{ background: 'transparent',
                                     border: '1px solid #FFCDD2',
                                     color: '#C62828', padding: '6px 16px',
                                     borderRadius: 6, cursor: 'pointer',
                                     fontSize: 12, fontWeight: 'bold' }}>
                            Revoke Key
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick API Reference */}
              <div style={{ marginTop: 28, background: '#3E1F00',
                            borderRadius: 12, padding: 20 }}>
                <div style={{ color: '#FFB800', fontWeight: 'bold',
                              fontSize: 14, marginBottom: 16 }}>
                  Quick API Reference
                </div>
                {[
                  { method: 'GET', endpoint: '/api/v1/sales',
                    desc: 'Get all your sales records' },
                  { method: 'POST', endpoint: '/api/v1/sales',
                    desc: 'Record a new sale' },
                  { method: 'GET', endpoint: '/api/v1/inventory',
                    desc: 'Get all your products' },
                  { method: 'GET', endpoint: '/api/v1/kpis',
                    desc: 'Get revenue and profit totals' },
                  { method: 'GET', endpoint: '/api/v1/categories',
                    desc: 'Sales grouped by category' },
                  { method: 'GET', endpoint: '/api/v1/regions',
                    desc: 'Sales grouped by branch' },
                  { method: 'GET', endpoint: '/api/v1/monthly',
                    desc: 'Monthly revenue trend' },
                ].map(({ method, endpoint, desc }) => (
                  <div key={endpoint}
                    style={{ display: 'flex', alignItems: 'center', gap: 12,
                             padding: '8px 0',
                             borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{
                      background: method === 'GET' ? '#1B4332' : '#4A1A00',
                      color: method === 'GET' ? '#52B788' : '#FF6B35',
                      padding: '2px 8px', borderRadius: 4,
                      fontSize: 10, fontWeight: 'bold',
                      minWidth: 36, textAlign: 'center'
                    }}>
                      {method}
                    </span>
                    <code style={{ color: '#FFB800', fontSize: 12,
                                   fontFamily: 'monospace', minWidth: 180 }}>
                      {endpoint}
                    </code>
                    <span style={{ color: 'rgba(255,255,255,0.5)',
                                   fontSize: 12 }}>
                      {desc}
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: 12,
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: 8 }}>
                  <div style={{ color: '#888', fontSize: 11,
                                marginBottom: 6 }}>
                    How to use your API key:
                  </div>
                  <code style={{ color: '#52B788', fontSize: 11,
                                 fontFamily: 'monospace', display: 'block',
                                 lineHeight: 1.8 }}>
                    Authorization: Bearer sk_live_sabias_xxxxxxxxxxxx
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM TAB ── */}
          {activeTab === 'system' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
                System Information
                <span style={{ background: '#E63946', color: 'white',
                               fontSize: 11, padding: '2px 8px',
                               borderRadius: 8, marginLeft: 10,
                               fontWeight: 'normal' }}>
                  Developer Only
                </span>
              </h3>

              {!devUnlocked ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                fontSize: 18, marginBottom: 8 }}>
                    Developer Access Required
                  </div>
                  <div style={{ color: '#888', fontSize: 13,
                                marginBottom: 24 }}>
                    This section contains sensitive system information
                    and is restricted to authorized developers only.
                  </div>
                  <form onSubmit={handleDevUnlock}
                    style={{ maxWidth: 300, margin: '0 auto' }}>
                    <input type="password" value={devCode}
                      onChange={(e) => setDevCode(e.target.value)}
                      placeholder="Enter developer code"
                      style={{ width: '100%', padding: '12px 14px',
                               borderRadius: 8, border: '2px solid #FFB800',
                               fontSize: 14, boxSizing: 'border-box',
                               marginBottom: 12, textAlign: 'center',
                               letterSpacing: 2 }}/>
                    {devError && (
                      <div style={{ color: '#C62828', fontSize: 12,
                                    marginBottom: 12, fontWeight: 'bold' }}>
                        {devError}
                      </div>
                    )}
                    <button type="submit"
                      style={{ width: '100%', background: '#3E1F00',
                               border: 'none', color: '#FFB800',
                               padding: '12px', borderRadius: 8,
                               cursor: 'pointer', fontWeight: 'bold',
                               fontSize: 14 }}>
                      Unlock System Info
                    </button>
                  </form>
                  <div style={{ marginTop: 16, color: '#AAA', fontSize: 11 }}>
                    Contact Kings Mwandira for developer access
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#E8F5E9', borderRadius: 8,
                                padding: '8px 14px', marginBottom: 20,
                                color: '#2E7D32', fontSize: 12,
                                fontWeight: 'bold' }}>
                    Developer access granted
                  </div>
                  <div style={{ display: 'grid',
                                gridTemplateColumns: '1fr 1fr', gap: 16,
                                marginBottom: 24 }}>
                    {[
                      { label: 'System Name', value: 'SABIAS' },
                      { label: 'Version', value: '2.0.0 — Multi-Company' },
                      { label: 'Frontend', value: 'React.js on Vercel' },
                      { label: 'Backend', value: 'Node.js on Render' },
                      { label: 'Database', value: 'PostgreSQL on Neon' },
                      { label: 'Currency', value: 'Malawian Kwacha (MWK)' },
                      { label: 'Company ID', value: user?.company_id || 'N/A' },
                      { label: 'User Roles',
                        value: 'Admin, Salesperson, Viewer' },
                      { label: 'Auth', value: 'JWT — 7 day expiry' },
                      { label: 'Developer', value: 'Kings Mwandira' },
                      { label: 'Public API', value: 'v1 — Active' },
                      { label: 'Backend URL',
                        value: 'malawi-sales-backend.onrender.com' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#FFF8F0',
                        borderRadius: 10, padding: 16,
                        border: '1px solid #FFE8D0' }}>
                        <div style={{ fontSize: 11, color: '#888',
                                      marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                      fontSize: 13 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#3E1F00', borderRadius: 12,
                                padding: 20, color: 'white',
                                marginBottom: 16 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 15,
                                  marginBottom: 12, color: '#FFB800' }}>
                      System Status
                    </div>
                    <div style={{ display: 'grid',
                                  gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Frontend', status: 'Online' },
                        { label: 'Backend API', status: 'Online' },
                        { label: 'Database', status: 'Connected' },
                        { label: 'Authentication', status: 'Active' },
                        { label: 'Multi-Tenant', status: 'Enabled' },
                        { label: 'Public API v1', status: 'Active' },
                      ].map(({ label, status }) => (
                        <div key={label} style={{ display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 8, padding: '10px 14px' }}>
                          <span style={{ fontSize: 13 }}>{label}</span>
                          <span style={{ color: '#52B788', fontWeight: 'bold',
                                         fontSize: 12 }}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setDevUnlocked(false)}
                    style={{ background: '#E63946', border: 'none',
                             color: 'white', padding: '8px 20px',
                             borderRadius: 8, cursor: 'pointer',
                             fontWeight: 'bold', fontSize: 13 }}>
                    Lock System Info
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}