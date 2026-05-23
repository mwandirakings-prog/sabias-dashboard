import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function SuperAdmin({ token, user, onLogout }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [extendDays, setExtendDays] = useState({});
  const [activateMonths, setActivateMonths] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fmt = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/superadmin/companies`,
        { headers: { Authorization: `Bearer ${token}` } });
      setCompanies(res.data.data);
    } catch (err) {
      setErrorMsg('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const getTrialInfo = (company) => {
    const now = new Date();
    const trialEnd = new Date(company.trial_ends_at);
    const subEnd = company.subscription_expires_at
      ? new Date(company.subscription_expires_at) : null;

    if (company.subscription_status === 'active' && subEnd) {
      const days = Math.ceil((subEnd - now) / (1000 * 60 * 60 * 24));
      if (days <= 0) return { label: 'Subscription Expired', color: '#C62828', bg: '#FFEBEE', days: 0 };
      return { label: `Active — ${days}d left`, color: '#2E7D32', bg: '#E8F5E9', days };
    }
    const days = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { label: 'Trial Expired', color: '#C62828', bg: '#FFEBEE', days: 0 };
    if (days <= 3) return { label: `Trial — ${days}d left`, color: '#E65100', bg: '#FFF3E0', days };
    return { label: `Trial — ${days}d left`, color: '#1565C0', bg: '#E3F2FD', days };
  };

  const handleToggle = async (company) => {
    try {
      await axios.put(
        `${API}/api/superadmin/companies/${company.id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(
        `${company.name} ${company.active ? 'deactivated' : 'activated'} successfully!`
      );
      fetchCompanies();
    } catch (err) {
      showError('Failed to toggle company status.');
    }
  };

  const handleExtend = async (company) => {
    const days = extendDays[company.id] || 7;
    try {
      await axios.put(
        `${API}/api/superadmin/companies/${company.id}/extend`,
        { days: parseInt(days) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(`Trial extended by ${days} days for ${company.name}!`);
      fetchCompanies();
    } catch (err) {
      showError('Failed to extend trial.');
    }
  };

  const handleActivate = async (company) => {
    const months = activateMonths[company.id] || 1;
    try {
      await axios.put(
        `${API}/api/superadmin/companies/${company.id}/activate`,
        { months: parseInt(months) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(`${company.name} activated for ${months} month(s)!`);
      fetchCompanies();
    } catch (err) {
      showError('Failed to activate subscription.');
    }
  };

  const handleDelete = async (company) => {
    try {
      await axios.delete(
        `${API}/api/superadmin/companies/${company.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(`${company.name} deleted successfully!`);
      setConfirmDelete(null);
      fetchCompanies();
    } catch (err) {
      showError('Failed to delete company.');
    }
  };

  const filtered = companies.filter(c => {
    const matchSearch = search === '' ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    const trialInfo = getTrialInfo(c);
    const matchStatus = filterStatus === 'All' ||
      (filterStatus === 'Active' && c.subscription_status === 'active') ||
      (filterStatus === 'Trial' && c.subscription_status === 'trial' && trialInfo.days > 0) ||
      (filterStatus === 'Expired' && trialInfo.days <= 0) ||
      (filterStatus === 'Inactive' && !c.active);
    return matchSearch && matchStatus;
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c =>
    c.subscription_status === 'active').length;
  const trialCompanies = companies.filter(c =>
    c.subscription_status === 'trial' &&
    getTrialInfo(c).days > 0).length;
  const expiredCompanies = companies.filter(c =>
    getTrialInfo(c).days <= 0).length;

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh',
                  background: '#0D1117' }}>

      {/* Top Bar */}
      <div style={{ background: '#161B22', borderBottom: '1px solid #30363D',
                    padding: '12px 32px', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#FFB800', color: '#0D1117',
                        fontWeight: 'bold', fontSize: 18,
                        padding: '6px 16px', borderRadius: 8,
                        letterSpacing: 2 }}>
            SABIAS
          </div>
          <div style={{ color: '#F0F6FC', fontWeight: 'bold', fontSize: 16 }}>
            Super Admin Portal
          </div>
          <span style={{ background: '#E63946', color: 'white',
                         fontSize: 10, padding: '2px 8px', borderRadius: 4,
                         fontWeight: 'bold' }}>
            MASTER ACCESS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#8B949E', fontSize: 13 }}>
            👑 {user?.name} — Kings Mwandira
          </div>
          <button onClick={fetchCompanies}
            style={{ background: '#21262D', border: '1px solid #30363D',
                     color: '#F0F6FC', padding: '6px 16px', borderRadius: 6,
                     cursor: 'pointer', fontSize: 13 }}>
            Refresh
          </button>
          <button onClick={onLogout}
            style={{ background: '#E63946', border: 'none', color: 'white',
                     padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                     fontSize: 13, fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: 32 }}>

        {/* Messages */}
        {actionMsg && (
          <div style={{ background: '#1B4332', border: '1px solid #2D6A4F',
                        borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                        color: '#52B788', fontWeight: 'bold' }}>
            ✓ {actionMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: '#4A0404', border: '1px solid #E63946',
                        borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                        color: '#FF6B6B', fontWeight: 'bold' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: '#F0F6FC', margin: 0, fontSize: 24 }}>
            Company Management
          </h2>
          <p style={{ color: '#8B949E', margin: '4px 0 0', fontSize: 13 }}>
            Manage all SABIAS registered companies — trials, subscriptions
            and access control
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Companies', value: totalCompanies,
              color: '#FFB800', icon: '🏢' },
            { label: 'Paid Active', value: activeCompanies,
              color: '#52B788', icon: '✅' },
            { label: 'On Trial', value: trialCompanies,
              color: '#4CC9F0', icon: '⏳' },
            { label: 'Expired', value: expiredCompanies,
              color: '#E63946', icon: '🔒' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: '#161B22',
              borderRadius: 12, padding: 20,
              border: `1px solid ${color}33`,
              borderLeft: `4px solid ${color}` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ color: '#8B949E', fontSize: 12,
                            marginBottom: 4 }}>{label}</div>
              <div style={{ color: '#F0F6FC', fontSize: 28,
                            fontWeight: 'bold' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20,
                      flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search company, email or city..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 8,
                     border: '1px solid #30363D', fontSize: 13,
                     width: 280, background: '#161B22', color: '#F0F6FC' }}/>
          {['All', 'Active', 'Trial', 'Expired', 'Inactive'].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{
                padding: '8px 18px', borderRadius: 20, cursor: 'pointer',
                fontWeight: 'bold', fontSize: 12, border: 'none',
                background: filterStatus === f ? '#FFB800' : '#21262D',
                color: filterStatus === f ? '#0D1117' : '#8B949E',
              }}>
              {f}
            </button>
          ))}
          <div style={{ color: '#8B949E', fontSize: 13, marginLeft: 'auto' }}>
            {filtered.length} of {totalCompanies} companies
          </div>
        </div>

        {/* Companies Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#8B949E',
                        fontSize: 18 }}>
            Loading companies...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#8B949E' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <div>No companies found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(company => {
              const trialInfo = getTrialInfo(company);
              return (
                <div key={company.id}
                  style={{ background: '#161B22', borderRadius: 12,
                           border: `1px solid ${company.active
                             ? '#30363D' : '#4A0404'}`,
                           padding: 20 }}>

                  {/* Company Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%',
                                    background: '#FFB800', color: '#0D1117',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: 'bold',
                                    fontSize: 20 }}>
                        {company.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#F0F6FC', fontWeight: 'bold',
                                      fontSize: 16 }}>
                          {company.name}
                          {!company.active && (
                            <span style={{ background: '#4A0404',
                                           color: '#FF6B6B', fontSize: 10,
                                           padding: '2px 8px', borderRadius: 4,
                                           marginLeft: 8, fontWeight: 'bold' }}>
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#8B949E', fontSize: 13,
                                      marginTop: 2 }}>
                          {company.email}
                        </div>
                        <div style={{ color: '#8B949E', fontSize: 12,
                                      marginTop: 2 }}>
                          📍 {company.city} · 📞 {company.phone} ·
                          👥 {company.user_count} user(s) ·
                          Joined {fmt(company.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 10 }}>
                      <span style={{ background: trialInfo.bg,
                                     color: trialInfo.color,
                                     padding: '4px 12px', borderRadius: 10,
                                     fontSize: 12, fontWeight: 'bold' }}>
                        {trialInfo.label}
                      </span>
                      <span style={{ background: '#21262D',
                                     color: '#8B949E', padding: '4px 12px',
                                     borderRadius: 10, fontSize: 11 }}>
                        ID: {company.id}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap',
                                paddingTop: 14,
                                borderTop: '1px solid #21262D' }}>

                    {/* Toggle Active */}
                    <button onClick={() => handleToggle(company)}
                      style={{ background: company.active
                                 ? '#4A0404' : '#1B4332',
                               border: 'none',
                               color: company.active ? '#FF6B6B' : '#52B788',
                               padding: '8px 16px', borderRadius: 6,
                               cursor: 'pointer', fontWeight: 'bold',
                               fontSize: 12 }}>
                      {company.active ? 'Deactivate' : 'Activate'}
                    </button>

                    {/* Extend Trial */}
                    <div style={{ display: 'flex', gap: 4,
                                  alignItems: 'center' }}>
                      <input type="number" min="1" max="90"
                        placeholder="Days"
                        value={extendDays[company.id] || ''}
                        onChange={(e) => setExtendDays({
                          ...extendDays, [company.id]: e.target.value })}
                        style={{ width: 64, padding: '7px 8px',
                                 borderRadius: 6, border: '1px solid #30363D',
                                 background: '#21262D', color: '#F0F6FC',
                                 fontSize: 12, textAlign: 'center' }}/>
                      <button onClick={() => handleExtend(company)}
                        style={{ background: '#1C2B4A',
                                 border: '1px solid #4CC9F0',
                                 color: '#4CC9F0', padding: '8px 14px',
                                 borderRadius: 6, cursor: 'pointer',
                                 fontWeight: 'bold', fontSize: 12 }}>
                        Extend Trial
                      </button>
                    </div>

                    {/* Activate Subscription */}
                    <div style={{ display: 'flex', gap: 4,
                                  alignItems: 'center' }}>
                      <select
                        value={activateMonths[company.id] || 1}
                        onChange={(e) => setActivateMonths({
                          ...activateMonths,
                          [company.id]: e.target.value })}
                        style={{ padding: '7px 8px', borderRadius: 6,
                                 border: '1px solid #30363D',
                                 background: '#21262D', color: '#F0F6FC',
                                 fontSize: 12 }}>
                        <option value={1}>1 Month</option>
                        <option value={2}>2 Months</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                      </select>
                      <button onClick={() => handleActivate(company)}
                        style={{ background: '#1B3A2A',
                                 border: '1px solid #52B788',
                                 color: '#52B788', padding: '8px 14px',
                                 borderRadius: 6, cursor: 'pointer',
                                 fontWeight: 'bold', fontSize: 12 }}>
                        Activate Paid
                      </button>
                    </div>

                    {/* Delete */}
                    {confirmDelete === company.id ? (
                      <div style={{ display: 'flex', gap: 6,
                                    alignItems: 'center' }}>
                        <span style={{ color: '#FF6B6B', fontSize: 12 }}>
                          Delete {company.name}?
                        </span>
                        <button onClick={() => handleDelete(company)}
                          style={{ background: '#E63946', border: 'none',
                                   color: 'white', padding: '6px 14px',
                                   borderRadius: 6, cursor: 'pointer',
                                   fontWeight: 'bold', fontSize: 12 }}>
                          Confirm
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          style={{ background: '#21262D',
                                   border: '1px solid #30363D',
                                   color: '#8B949E', padding: '6px 14px',
                                   borderRadius: 6, cursor: 'pointer',
                                   fontSize: 12 }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(company.id)}
                        style={{ background: 'transparent',
                                 border: '1px solid #4A0404',
                                 color: '#FF6B6B', padding: '8px 14px',
                                 borderRadius: 6, cursor: 'pointer',
                                 fontSize: 12, marginLeft: 'auto' }}>
                        Delete Company
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}