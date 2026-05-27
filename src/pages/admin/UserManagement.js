import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function UserManagement({ token, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'salesperson', region: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/users`,
        { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      if (editUser) {
        await axios.put(`${API}/api/users/${editUser.id}`, {
          name: form.name, role: form.role,
          region: form.region, active: true
        }, h);
        setSuccessMsg('User updated successfully!');
      } else {
        await axios.post(`${API}/api/users`, {
          name: form.name, email: form.email,
          password: form.password, role: form.role, region: form.region,
        }, h);
        setSuccessMsg('User added successfully!');
      }
      setForm({ name: '', email: '', password: '',
                role: 'salesperson', region: 'Lilongwe' });
      setShowForm(false);
      setEditUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API}/api/users/${passwordUser.id}/password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('Password reset successfully!');
      setShowPasswordForm(false);
      setPasswordUser(null);
      setNewPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email,
              password: '', role: u.role, region: u.region });
    setShowForm(true);
    setShowPasswordForm(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user ${name}?`)) return;
    try {
      await axios.delete(`${API}/api/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('User deleted!');
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') return { bg: '#FFF3E0', color: '#E65100' };
    if (role === 'salesperson') return { bg: '#E8F5E9', color: '#2E7D32' };
    return { bg: '#E3F2FD', color: '#1565C0' };
  };

  const totalAdmin = users.filter(u => u.role === 'admin').length;
  const totalSales = users.filter(u => u.role === 'salesperson').length;
  const totalViewer = users.filter(u => u.role === 'viewer').length;

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 20,
                    flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
            User Management
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Manage users for{' '}
            <strong style={{ color: '#FF6B35' }}>
              {user?.company || 'Your Company'}
            </strong>
          </p>
        </div>
        <button onClick={() => {
          setShowForm(!showForm); setEditUser(null);
          setShowPasswordForm(false);
          setForm({ name: '', email: '', password: '',
                    role: 'salesperson', region: '' });
        }}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
            padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 'bold', fontSize: 14 }}>
          + Add User
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* KPI Cards — mobile responsive */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: users.length, color: '#FF6B35' },
          { label: 'Admins', value: totalAdmin, color: '#E65100' },
          { label: 'Salespersons', value: totalSales, color: '#2D6A4F' },
          { label: 'Viewers', value: totalViewer, color: '#457B9D' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 16, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ color: '#3E1F00', fontSize: 22, fontWeight: 'bold' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
            {editUser ? `Edit User — ${editUser.name}` : 'Add New User'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                  display: 'block', marginBottom: 5 }}>Full Name *</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tadala Banda"
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                    border: '1.5px solid #FFB800', fontSize: 13,
                    boxSizing: 'border-box' }}/>
              </div>
              {!editUser && (
                <div>
                  <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                    display: 'block', marginBottom: 5 }}>Email Address *</label>
                  <input type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. tadala@company.com"
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                      border: '1.5px solid #FFB800', fontSize: 13,
                      boxSizing: 'border-box' }}/>
                </div>
              )}
              {!editUser && (
                <div>
                  <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                    display: 'block', marginBottom: 5 }}>Password *</label>
                  <input type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                      border: '1.5px solid #FFB800', fontSize: 13,
                      boxSizing: 'border-box' }}/>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                  display: 'block', marginBottom: 5 }}>Role *</label>
                <select required value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                    border: '1.5px solid #FFB800', fontSize: 13,
                    boxSizing: 'border-box' }}>
                  <option value="admin">Admin</option>
                  <option value="salesperson">Salesperson</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                  display: 'block', marginBottom: 5 }}>Branch</label>
                <input type="text" value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="e.g. Blantyre, Lilongwe..."
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                    border: '1.5px solid #FFB800', fontSize: 13,
                    boxSizing: 'border-box' }}/>
                <div style={{ color: '#AAA', fontSize: 10, marginTop: 3 }}>
                  Leave blank for all branches
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                  padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13 }}>
                {submitting ? 'Saving...' : editUser ? 'Update User' : 'Add User'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditUser(null); }}
                style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                  padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Form */}
      {showPasswordForm && passwordUser && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
          border: '2px solid #FFB800' }}>
          <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
            Reset Password — {passwordUser.name}
          </h3>
          <form onSubmit={handlePasswordReset}>
            <div style={{ maxWidth: 300 }}>
              <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                display: 'block', marginBottom: 5 }}>New Password *</label>
              <input type="password" required value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                  border: '1.5px solid #FFB800', fontSize: 13,
                  boxSizing: 'border-box', marginBottom: 14 }}/>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                  padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13 }}>
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
              <button type="button"
                onClick={() => { setShowPasswordForm(false); setPasswordUser(null); }}
                style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                  padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            System Users ({users.length})
          </div>
          <button onClick={fetchUsers}
            style={{ padding: '8px 14px', background: '#FF6B35', border: 'none',
              borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13 }}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading users...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse',
                            fontSize: 12, minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#3E1F00' }}>
                  {['Name','Email','Role','Branch','Status','Created','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', color: '#FFB800',
                      textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const roleBadge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} style={{
                      background: i % 2 === 0 ? '#FFF8F0' : 'white',
                      borderBottom: '1px solid #FFE8D0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: '600',
                                   color: '#3E1F00' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%',
                            background: '#FF6B35', color: 'white', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: 12, flexShrink: 0 }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#888',
                                   fontSize: 12 }}>{u.email}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ background: roleBadge.bg, color: roleBadge.color,
                          padding: '2px 8px', borderRadius: 10, fontSize: 11,
                          fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{u.region}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          background: u.active ? '#E8F5E9' : '#FFEBEE',
                          color: u.active ? '#2E7D32' : '#C62828',
                          padding: '2px 8px', borderRadius: 10,
                          fontSize: 11, fontWeight: 'bold' }}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#888' }}>
                        {u.created_at?.split('T')[0]}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => handleEdit(u)}
                            style={{ background: '#FFB800', border: 'none',
                              color: '#3E1F00', padding: '3px 7px',
                              borderRadius: 5, cursor: 'pointer',
                              fontSize: 11, fontWeight: 'bold' }}>
                            Edit
                          </button>
                          <button onClick={() => {
                            setPasswordUser(u);
                            setShowPasswordForm(true);
                            setShowForm(false);
                          }}
                            style={{ background: '#E3F2FD', border: 'none',
                              color: '#1565C0', padding: '3px 7px',
                              borderRadius: 5, cursor: 'pointer',
                              fontSize: 11, fontWeight: 'bold' }}>
                            Pwd
                          </button>
                          <button onClick={() => handleDelete(u.id, u.name)}
                            style={{ background: '#FFEBEE', border: 'none',
                              color: '#C62828', padding: '3px 7px',
                              borderRadius: 5, cursor: 'pointer',
                              fontSize: 11, fontWeight: 'bold' }}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}