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
  const [newKeyType, setNewKeyType] = useState('live'); // live | test
  const [generatingKey, setGeneratingKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [keyFilter, setKeyFilter] = useState('all'); // all | live | test

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
        { name: newKeyName, key_type: newKeyType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewKeyName('');
      showSuccess(`New ${newKeyType === 'test' ? 'Test' : 'Live'} API key generated!`);
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

  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      await axios.put(`${API}/api/auth/profile`,
        { name: profile.name, email: profile.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwords.newPass !== passwords.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwords.newPass.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    try {
      await axios.put(`${API}/api/auth/change-password`,
        { current_password: passwords.current, new_password: passwords.newPass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswords({ current: '', newPass: '', confirm: '' });
      showSuccess('Password changed successfully!');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
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

  const isTestKey = (keyValue) =>
    keyValue?.startsWith('sk_test_sabias_');

  const filteredKeys = apiKeys.filter(k => {
    if (keyFilter === 'live') return !isTestKey(k.key_value);
    if (keyFilter === 'test') return isTestKey(k.key_value);
    return true;
  });

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

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
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
          ✓ {successMsg}
        </div>
      )}

      {/* Layout — stack on mobile */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, alignItems: 'start' }}>

        {/* Sidebar Tabs */}
        <div style={{ background: 'white', borderRadius: 12, padding: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== 'system') setDevUnlocked(false);
              setApiKeyError('');
            }}
              style={{ width: '100%', textAlign: 'left',
                padding: '11px 14px', borderRadius: 8, border: 'none',
                cursor: 'pointer', marginBottom: 3, fontWeight: 'bold',
                fontSize: 13,
                background: activeTab === tab.id ? '#3E1F00' : 'transparent',
                color: activeTab === tab.id ? '#FFB800' : '#888' }}>
              {tab.label}
              {tab.id === 'apikeys' && (
                <span style={{ marginLeft: 8, background: '#FF6B35',
                  color: 'white', fontSize: 10, padding: '1px 6px',
                  borderRadius: 10 }}>
                  {apiKeys.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minWidth: 0 }}>

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
                Profile Settings
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16,
                marginBottom: 24, padding: 16, background: '#FFF8F0',
                borderRadius: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%',
                  background: '#FF6B35', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 'bold', flexShrink: 0 }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                fontSize: 16 }}>{user?.name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    {user?.email}
                  </div>
                  <div style={{ color: '#FF6B35', fontSize: 12, marginTop: 3,
                                fontWeight: 'bold' }}>
                    {user?.company || 'Your Company'}
                  </div>
                  <span style={{ background: '#FFB800', color: '#3E1F00',
                    padding: '2px 8px', borderRadius: 10, fontSize: 11,
                    fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <form onSubmit={handleProfileSave}>
                <div style={{ display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 14 }}>
                  {[
                    { label: 'Full Name', key: 'name', type: 'text',
                      val: profile.name,
                      onChange: (v) => setProfile({ ...profile, name: v }) },
                    { label: 'Email Address', key: 'email', type: 'email',
                      val: profile.email,
                      onChange: (v) => setProfile({ ...profile, email: v }) },
                  ].map(({ label, key, type, val, onChange }) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, color: '#555',
                        fontWeight: 'bold', display: 'block',
                        marginBottom: 5 }}>{label}</label>
                      <input type={type} value={val}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px',
                          borderRadius: 8, border: '1.5px solid #FFB800',
                          fontSize: 13, boxSizing: 'border-box' }}/>
                    </div>
                  ))}
                  {[
                    { label: 'Role', val: user?.role },
                    { label: 'Company', val: user?.company || 'Your Company' },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <label style={{ fontSize: 11, color: '#555',
                        fontWeight: 'bold', display: 'block',
                        marginBottom: 5 }}>{label}</label>
                      <input type="text" value={val} disabled
                        style={{ width: '100%', padding: '10px 12px',
                          borderRadius: 8, border: '1.5px solid #EEE',
                          fontSize: 13, boxSizing: 'border-box',
                          background: '#F5F5F5', color: '#888',
                          textTransform: 'capitalize' }}/>
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={profileSaving}
                  style={{ marginTop: 16, background: profileSaving ? '#AAA' : '#FF6B35',
                    border: 'none', color: 'white', padding: '10px 24px', borderRadius: 8,
                    cursor: profileSaving ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial' }}>
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
                {profileError && (
                  <div style={{ marginTop: 10, color: '#C62828', fontSize: 12,
                    background: '#FFEBEE', padding: '8px 12px', borderRadius: 6 }}>
                    {profileError}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ── PASSWORD TAB ── */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
                Change Password
              </h3>
              <form onSubmit={handlePasswordSave} style={{ maxWidth: 380 }}>
                {[
                  { label: 'Current Password', key: 'current' },
                  { label: 'New Password', key: 'newPass' },
                  { label: 'Confirm New Password', key: 'confirm' },
                ].map(({ label, key }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#555',
                      fontWeight: 'bold', display: 'block',
                      marginBottom: 5 }}>{label}</label>
                    <input type="password" required value={passwords[key]}
                      onChange={(e) => setPasswords({
                        ...passwords, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px',
                        borderRadius: 8, border: '1.5px solid #FFB800',
                        fontSize: 13, boxSizing: 'border-box' }}/>
                  </div>
                ))}
                <div style={{ background: '#FFF8F0', borderRadius: 8,
                  padding: 12, marginBottom: 14, fontSize: 12, color: '#888' }}>
                  Password must be at least 8 characters
                </div>
                {passwordError && (
                  <div style={{ marginBottom: 14, color: '#C62828', fontSize: 12,
                    background: '#FFEBEE', padding: '8px 12px', borderRadius: 6 }}>
                    {passwordError}
                  </div>
                )}
                <button type="submit" disabled={passwordSaving}
                  style={{ background: passwordSaving ? '#AAA' : '#FF6B35',
                    border: 'none', color: 'white', padding: '10px 24px',
                    borderRadius: 8, cursor: passwordSaving ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial' }}>
                  {passwordSaving ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
                Notification Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    padding: 14, background: '#FFF8F0', borderRadius: 10,
                    border: '1px solid #FFE8D0', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                    fontSize: 13 }}>{label}</div>
                      <div style={{ color: '#888', fontSize: 11,
                                    marginTop: 2 }}>{desc}</div>
                    </div>
                    <div onClick={() => setNotifications({
                      ...notifications, [key]: !notifications[key] })}
                      style={{ width: 44, height: 24, borderRadius: 12,
                        background: notifications[key] ? '#FF6B35' : '#DDD',
                        cursor: 'pointer', position: 'relative',
                        transition: 'background 0.3s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%',
                        background: 'white', position: 'absolute', top: 3,
                        transition: 'left 0.3s',
                        left: notifications[key] ? 22 : 3,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}/>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => showSuccess('Preferences saved!')}
                style={{ marginTop: 16, background: '#FF6B35', border: 'none',
                  color: 'white', padding: '10px 24px', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
                Save Preferences
              </button>
            </div>
          )}

          {/* ── API KEYS TAB ── */}
          {activeTab === 'apikeys' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
                API Keys
              </h3>

              {/* Explain test vs live */}
              <div style={{ display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#E8F5E9', borderRadius: 10,
                  padding: 14, border: '1px solid #A5D6A7' }}>
                  <div style={{ fontWeight: 'bold', color: '#2E7D32',
                                fontSize: 13, marginBottom: 4 }}>
                    Live Key — sk_live_sabias_...
                  </div>
                  <div style={{ color: '#555', fontSize: 12, lineHeight: 1.6 }}>
                    Connects to your real company data. Use for production
                    apps, WhatsApp bots and accounting systems that are
                    already live.
                  </div>
                </div>
                <div style={{ background: '#FFF8E1', borderRadius: 10,
                  padding: 14, border: '1px solid #FFE082' }}>
                  <div style={{ fontWeight: 'bold', color: '#E65100',
                                fontSize: 13, marginBottom: 4 }}>
                    Test Key — sk_test_sabias_...
                  </div>
                  <div style={{ color: '#555', fontSize: 12, lineHeight: 1.6 }}>
                    Safe for developers to test integrations. Connects to
                    real API but clearly marked as test. Use when building
                    and testing new connections.
                  </div>
                </div>
              </div>

              {apiKeyError && (
                <div style={{ background: '#FFEBEE',
                  border: '1px solid #FFCDD2', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 14,
                  color: '#C62828', fontSize: 13 }}>
                  {apiKeyError}
                </div>
              )}

              {/* Generate New Key */}
              <div style={{ background: '#FFF8F0', borderRadius: 12,
                padding: 18, marginBottom: 24, border: '1px solid #FFE8D0' }}>
                <div style={{ fontWeight: 'bold', color: '#3E1F00',
                              fontSize: 14, marginBottom: 4 }}>
                  Generate New API Key
                </div>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 14 }}>
                  Give your key a name. Choose Test for development,
                  Live for production. Maximum 3 active keys.
                </div>

                {/* Key Type Toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['live', 'test'].map(type => (
                    <button key={type} onClick={() => setNewKeyType(type)}
                      style={{ padding: '8px 20px', borderRadius: 8,
                        border: 'none', cursor: 'pointer',
                        fontWeight: 'bold', fontSize: 12,
                        background: newKeyType === type
                          ? (type === 'live' ? '#2D6A4F' : '#E65100')
                          : '#EEE',
                        color: newKeyType === type ? 'white' : '#888' }}>
                      {type === 'live' ? 'Live Key' : 'Test Key'}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input type="text" value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder={newKeyType === 'test'
                      ? 'e.g. Dev Testing, WhatsApp Test'
                      : 'e.g. My WhatsApp Bot, Accounting System'}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8,
                      border: `1.5px solid ${newKeyType === 'test'
                        ? '#FFB800' : '#2D6A4F'}`,
                      fontSize: 13, outline: 'none', minWidth: 160 }}/>
                  <button onClick={handleGenerateKey} disabled={generatingKey}
                    style={{ background: generatingKey ? '#AAA'
                      : newKeyType === 'test' ? '#FF6B35' : '#2D6A4F',
                      border: 'none', color: 'white', padding: '10px 20px',
                      borderRadius: 8, cursor: generatingKey
                        ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold', fontSize: 13,
                      whiteSpace: 'nowrap', fontFamily: 'Arial' }}>
                    {generatingKey ? 'Generating...'
                      : `Generate ${newKeyType === 'test' ? 'Test' : 'Live'} Key`}
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16,
                            flexWrap: 'wrap' }}>
                {['all', 'live', 'test'].map(f => (
                  <button key={f} onClick={() => setKeyFilter(f)}
                    style={{ padding: '6px 16px', borderRadius: 20,
                      border: 'none', cursor: 'pointer', fontSize: 12,
                      fontWeight: 'bold',
                      background: keyFilter === f ? '#3E1F00' : '#FFF8F0',
                      color: keyFilter === f ? '#FFB800' : '#888' }}>
                    {f === 'all' ? 'All Keys'
                      : f === 'live' ? 'Live Keys' : 'Test Keys'}
                    <span style={{ marginLeft: 6,
                      background: keyFilter === f ? '#FF6B35' : '#FFE8D0',
                      color: keyFilter === f ? 'white' : '#888',
                      padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
                      {f === 'all' ? apiKeys.length
                        : f === 'live'
                        ? apiKeys.filter(k => !isTestKey(k.key_value)).length
                        : apiKeys.filter(k => isTestKey(k.key_value)).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* API Keys List */}
              {apiKeysLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  Loading API keys...
                </div>
              ) : filteredKeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40,
                  background: '#FFF8F0', borderRadius: 12,
                  border: '1px dashed #FFB800' }}>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                fontSize: 14, marginBottom: 8 }}>
                    No {keyFilter !== 'all' ? keyFilter : ''} API Keys Yet
                  </div>
                  <div style={{ color: '#888', fontSize: 13 }}>
                    Generate your first API key above.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column',
                              gap: 12 }}>
                  {filteredKeys.map(key => {
                    const isTest = isTestKey(key.key_value);
                    return (
                      <div key={key.id}
                        style={{ background: 'white', borderRadius: 12,
                          padding: 18, opacity: key.active ? 1 : 0.5,
                          border: `1px solid ${isTest
                            ? '#FFE082' : '#FFE8D0'}` }}>

                        {/* Key Header */}
                        <div style={{ display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start', marginBottom: 12,
                          flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center',
                                          gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 'bold',
                                             color: '#3E1F00', fontSize: 14 }}>
                                {key.name}
                              </span>
                              {/* Test/Live badge */}
                              <span style={{
                                background: isTest ? '#FFF8E1' : '#E8F5E9',
                                color: isTest ? '#E65100' : '#2E7D32',
                                padding: '2px 10px', borderRadius: 10,
                                fontSize: 10, fontWeight: 'bold',
                                border: `1px solid ${isTest
                                  ? '#FFE082' : '#A5D6A7'}` }}>
                                {isTest ? 'TEST' : 'LIVE'}
                              </span>
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
                            fontSize: 11, fontWeight: 'bold' }}>
                            {key.active ? 'Active' : 'Revoked'}
                          </span>
                        </div>

                        {/* Key Value */}
                        <div style={{ background: isTest ? '#FFFDE7' : '#FFF8F0',
                          borderRadius: 8, padding: '10px 12px',
                          marginBottom: 12, display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between',
                          gap: 8, flexWrap: 'wrap' }}>
                          <code style={{ fontSize: 11, color: '#3E1F00',
                            fontFamily: 'monospace', wordBreak: 'break-all',
                            flex: 1 }}>
                            {key.key_value}
                          </code>
                          <button onClick={() => handleCopyKey(
                            key.key_value, key.id)}
                            style={{ background: copiedKey === key.id
                              ? '#2E7D32' : '#3E1F00',
                              border: 'none', color: '#FFB800',
                              padding: '5px 12px', borderRadius: 6,
                              cursor: 'pointer', fontSize: 11,
                              fontWeight: 'bold', whiteSpace: 'nowrap',
                              flexShrink: 0 }}>
                            {copiedKey === key.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>

                        {/* Usage Stats */}
                        <div style={{ display: 'flex', gap: 16,
                                      marginBottom: 10, flexWrap: 'wrap' }}>
                          {[
                            { label: 'Today', value: key.requests_today,
                              sub: '/1000', color: '#FF6B35' },
                            { label: 'Total', value: key.requests_total,
                              color: '#3E1F00' },
                            { label: 'Limit', value: '1,000',
                              sub: '/day', color: '#2E7D32' },
                          ].map(({ label, value, sub, color }) => (
                            <div key={label}>
                              <div style={{ fontSize: 10, color: '#AAA',
                                textTransform: 'uppercase',
                                letterSpacing: 1 }}>{label}</div>
                              <div style={{ fontSize: 16, fontWeight: 'bold',
                                            color }}>
                                {value}
                                {sub && <span style={{ fontSize: 10,
                                  color: '#AAA', fontWeight: 'normal' }}>
                                  {sub}</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Usage Bar */}
                        <div style={{ background: '#FFE8D0', borderRadius: 4,
                                      height: 5, marginBottom: 12 }}>
                          <div style={{
                            width: `${Math.min(
                              (key.requests_today / 1000) * 100, 100)}%`,
                            background: key.requests_today > 800
                              ? '#C62828' : '#FF6B35',
                            height: '100%', borderRadius: 4 }}/>
                        </div>

                        {/* Revoke */}
                        {key.active && (
                          confirmRevoke === key.id ? (
                            <div style={{ display: 'flex', gap: 8,
                              alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: '#C62828' }}>
                                Revoke this key? Cannot be undone.
                              </span>
                              <button onClick={() => handleRevokeKey(key)}
                                style={{ background: '#C62828', border: 'none',
                                  color: 'white', padding: '5px 12px',
                                  borderRadius: 6, cursor: 'pointer',
                                  fontWeight: 'bold', fontSize: 12 }}>
                                Confirm Revoke
                              </button>
                              <button onClick={() => setConfirmRevoke(null)}
                                style={{ background: '#F5F5F5', border: 'none',
                                  color: '#888', padding: '5px 12px',
                                  borderRadius: 6, cursor: 'pointer',
                                  fontSize: 12 }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmRevoke(key.id)}
                              style={{ background: 'transparent',
                                border: '1px solid #FFCDD2', color: '#C62828',
                                padding: '5px 14px', borderRadius: 6,
                                cursor: 'pointer', fontSize: 12,
                                fontWeight: 'bold' }}>
                              Revoke Key
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick API Reference */}
              <div style={{ marginTop: 24, background: '#3E1F00',
                            borderRadius: 12, padding: 18 }}>
                <div style={{ color: '#FFB800', fontWeight: 'bold',
                              fontSize: 14, marginBottom: 14 }}>
                  Quick API Reference
                </div>
                {[
                  { method: 'GET', endpoint: '/api/v1/sales',
                    desc: 'Get all sales' },
                  { method: 'POST', endpoint: '/api/v1/sales',
                    desc: 'Record a new sale' },
                  { method: 'GET', endpoint: '/api/v1/inventory',
                    desc: 'Get all products' },
                  { method: 'GET', endpoint: '/api/v1/kpis',
                    desc: 'Revenue and profit totals' },
                  { method: 'GET', endpoint: '/api/v1/categories',
                    desc: 'Sales by category' },
                  { method: 'GET', endpoint: '/api/v1/regions',
                    desc: 'Sales by branch' },
                  { method: 'GET', endpoint: '/api/v1/monthly',
                    desc: 'Monthly trend' },
                ].map(({ method, endpoint, desc }) => (
                  <div key={endpoint} style={{ display: 'flex',
                    alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    flexWrap: 'wrap' }}>
                    <span style={{ background: method === 'GET'
                      ? '#1B4332' : '#4A1A00',
                      color: method === 'GET' ? '#52B788' : '#FF6B35',
                      padding: '2px 7px', borderRadius: 4, fontSize: 10,
                      fontWeight: 'bold', minWidth: 34,
                      textAlign: 'center' }}>
                      {method}
                    </span>
                    <code style={{ color: '#FFB800', fontSize: 11,
                      fontFamily: 'monospace', minWidth: 160 }}>
                      {endpoint}
                    </code>
                    <span style={{ color: 'rgba(255,255,255,0.5)',
                                   fontSize: 11 }}>
                      {desc}
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: 12,
                  background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div style={{ color: '#888', fontSize: 11, marginBottom: 5 }}>
                    Base URL:
                  </div>
                  <code style={{ color: '#52B788', fontSize: 11,
                    fontFamily: 'monospace', display: 'block' }}>
                    https://api.sabiasanalytics.com
                  </code>
                  <div style={{ color: '#888', fontSize: 11,
                                marginTop: 8, marginBottom: 5 }}>
                    Authorization header:
                  </div>
                  <code style={{ color: '#52B788', fontSize: 11,
                    fontFamily: 'monospace', display: 'block' }}>
                    Bearer sk_live_sabias_xxxx (live) or sk_test_sabias_xxxx (test)
                  </code>
                </div>
                <a href="https://info.sabiasanalytics.com/api-docs.html"
                  target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 12,
                    color: '#FFB800', fontSize: 12, fontWeight: 'bold' }}>
                  View Full API Documentation →
                </a>
              </div>
            </div>
          )}

          {/* ── SYSTEM TAB ── */}
          {activeTab === 'system' && (
            <div>
              <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
                System Information
                <span style={{ background: '#E63946', color: 'white',
                  fontSize: 11, padding: '2px 8px', borderRadius: 8,
                  marginLeft: 10, fontWeight: 'normal' }}>
                  Developer Only
                </span>
              </h3>

              {!devUnlocked ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                fontSize: 16, marginBottom: 8 }}>
                    Developer Access Required
                  </div>
                  <div style={{ color: '#888', fontSize: 13,
                                marginBottom: 24 }}>
                    This section contains sensitive system information
                    restricted to authorized developers only.
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
                        border: 'none', color: '#FFB800', padding: '12px',
                        borderRadius: 8, cursor: 'pointer', fontWeight: 'bold',
                        fontSize: 14, fontFamily: 'Arial' }}>
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
                    color: '#2E7D32', fontSize: 12, fontWeight: 'bold' }}>
                    ✓ Developer access granted
                  </div>
                  <div style={{ display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'System Name', value: 'SABIAS' },
                      { label: 'Version', value: '2.0.0 — Multi-Company' },
                      { label: 'Frontend', value: 'React.js on Vercel' },
                      { label: 'Backend', value: 'Node.js on Render' },
                      { label: 'Database', value: 'PostgreSQL on Neon' },
                      { label: 'Currency', value: 'Malawian Kwacha (MWK)' },
                      { label: 'Company ID',
                        value: user?.company_id || 'N/A' },
                      { label: 'User Roles',
                        value: 'Admin, Salesperson, Viewer' },
                      { label: 'Auth', value: 'JWT — 7 day expiry' },
                      { label: 'Developer', value: 'Kings Mwandira' },
                      { label: 'Public API', value: 'v1 — Active' },
                      { label: 'API URL',
                        value: 'api.sabiasanalytics.com' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#FFF8F0',
                        borderRadius: 10, padding: 14,
                        border: '1px solid #FFE8D0' }}>
                        <div style={{ fontSize: 10, color: '#888',
                                      marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                      fontSize: 12 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#3E1F00', borderRadius: 12,
                    padding: 18, color: 'white', marginBottom: 14 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14,
                                  marginBottom: 12, color: '#FFB800' }}>
                      System Status
                    </div>
                    <div style={{ display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 10 }}>
                      {[
                        { label: 'Frontend', status: 'Online' },
                        { label: 'Backend API', status: 'Online' },
                        { label: 'Database', status: 'Connected' },
                        { label: 'Authentication', status: 'Active' },
                        { label: 'Multi-Tenant', status: 'Enabled' },
                        { label: 'Public API v1', status: 'Active' },
                        { label: 'Cloudflare Proxy', status: 'Active' },
                        { label: 'Live/Test Keys', status: 'Enabled' },
                      ].map(({ label, status }) => (
                        <div key={label} style={{ display: 'flex',
                          justifyContent: 'space-between', alignItems: 'center',
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: 8, padding: '8px 12px' }}>
                          <span style={{ fontSize: 12 }}>{label}</span>
                          <span style={{ color: '#52B788', fontWeight: 'bold',
                                         fontSize: 11 }}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setDevUnlocked(false)}
                    style={{ background: '#E63946', border: 'none',
                      color: 'white', padding: '8px 18px', borderRadius: 8,
                      cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>
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