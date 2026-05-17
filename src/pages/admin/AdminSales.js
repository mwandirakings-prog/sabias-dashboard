import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function AdminSales({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [form, setForm] = useState({
    sale_date: '', product: '', category: '', region: '',
    customer: '', quantity: '', unit_price: '', unit_cost: '',
    salesperson: '', payment: 'Cash'
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchSales = useCallback(async () => {
    try {
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

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/sales`, {
        ...form,
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
        unit_cost: parseFloat(form.unit_cost),
        company_id: user?.company_id,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('Sale recorded successfully!');
      setForm({ sale_date: '', product: '', category: '', region: '',
                customer: '', quantity: '', unit_price: '', unit_cost: '',
                salesperson: '', payment: 'Cash' });
      setShowForm(false);
      fetchSales();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueCategories = ['All', ...new Set(sales.map(s => s.category).filter(Boolean))];
  const uniquePayments = ['All', 'Cash', 'Mobile Money', 'Credit',
                          'Bank Transfer', 'Voucher'];

  const filtered = sales.filter(s => {
    const matchSearch = search === '' ||
      s.product?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase()) ||
      s.salesperson?.toLowerCase().includes(search.toLowerCase());
    const matchPayment = filterPayment === 'All' || s.payment === filterPayment;
    const matchCategory = filterCategory === 'All' || s.category === filterCategory;
    return matchSearch && matchPayment && matchCategory;
  });

  // Summary stats
  const totalRevenue = filtered.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
  const totalProfit = filtered.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0 }}>Sales Management</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            View, record and manage all sales transactions
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
                   padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 14 }}>
          + Record Sale
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <h3 style={{ color: '#3E1F00', marginTop: 0 }}>Record New Sale</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Sale Date', key: 'sale_date', type: 'date' },
                { label: 'Product Name', key: 'product', type: 'text' },
                { label: 'Category', key: 'category', type: 'text' },
                { label: 'Branch/Region', key: 'region', type: 'text' },
                { label: 'Customer', key: 'customer', type: 'text' },
                { label: 'Quantity', key: 'quantity', type: 'number' },
                { label: 'Unit Price (MWK)', key: 'unit_price', type: 'number' },
                { label: 'Unit Cost (MWK)', key: 'unit_cost', type: 'number' },
                { label: 'Salesperson', key: 'salesperson', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: '#888',
                                  display: 'block', marginBottom: 4 }}>
                    {label}
                  </label>
                  <input type={type} required={key !== 'customer'} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                             border: '1px solid #FFB800', fontSize: 13,
                             boxSizing: 'border-box' }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: '#888',
                                display: 'block', marginBottom: 4 }}>
                  Payment Method
                </label>
                <select value={form.payment}
                  onChange={(e) => setForm({ ...form, payment: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                           border: '1px solid #FFB800', fontSize: 13,
                           boxSizing: 'border-box' }}>
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Credit</option>
                  <option>Bank Transfer</option>
                  <option>Voucher</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                         padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
                         fontWeight: 'bold' }}>
                {submitting ? 'Saving...' : 'Save Sale'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                         padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
                         fontWeight: 'bold' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Filtered Transactions', value: filtered.length, color: '#FF6B35' },
          { label: 'Filtered Revenue', value: `MK ${fmt(totalRevenue)}`, color: '#2D6A4F' },
          { label: 'Filtered Profit', value: `MK ${fmt(totalProfit)}`, color: '#FFB800' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 16, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 18, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16,
                      flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold' }}>
            All Transactions ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="Search product, customer, salesperson..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13, width: 200 }}/>
            <select value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13 }}>
              {uniqueCategories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13 }}>
              {uniquePayments.map(p => <option key={p}>{p}</option>)}
            </select>
            <button onClick={fetchSales}
              style={{ padding: '8px 16px', background: '#FF6B35', border: 'none',
                       borderRadius: 8, color: 'white', cursor: 'pointer',
                       fontSize: 13 }}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#3E1F00' }}>
                  {['Date','Product','Category','Branch','Customer',
                    'Qty','Revenue','Profit','Salesperson','Payment'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
                                        textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((s, i) => (
                  <tr key={s.id} style={{
                    background: i % 2 === 0 ? '#FFF8F0' : 'white',
                    borderBottom: '1px solid #FFE8D0' }}>
                    <td style={{ padding: '8px 12px' }}>{s.sale_date?.split('T')[0]}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '500',
                                 color: '#3E1F00' }}>{s.product}</td>
                    <td style={{ padding: '8px 12px' }}>{s.category}</td>
                    <td style={{ padding: '8px 12px' }}>{s.region}</td>
                    <td style={{ padding: '8px 12px' }}>{s.customer || 'Walk-in'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {fmt(s.quantity)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right',
                                 color: '#2D6A4F' }}>
                      MK {fmt(s.revenue)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right',
                                 color: '#FF6B35' }}>
                      MK {fmt(s.profit)}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{s.salesperson}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: s.payment === 'Cash' ? '#E8F5E9' :
                                    s.payment === 'Mobile Money' ? '#E3F2FD' :
                                    s.payment === 'Voucher' ? '#F3E5F5' : '#FFF3E0',
                        color: s.payment === 'Cash' ? '#2E7D32' :
                               s.payment === 'Mobile Money' ? '#1565C0' :
                               s.payment === 'Voucher' ? '#6A1B9A' : '#E65100',
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
        )}
      </div>
    </div>
  );
}