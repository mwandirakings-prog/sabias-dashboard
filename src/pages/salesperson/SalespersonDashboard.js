import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function SalespersonDashboard({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    product: '', category: '', region: user?.region !== 'all' ? user?.region : '',
    customer: '', quantity: '', unit_price: '', unit_cost: '',
    salesperson: user?.name || '', payment: 'Cash'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/sales`, {
        ...form,
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
        unit_cost: parseFloat(form.unit_cost),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('Sale submitted successfully!');
      setForm({
        sale_date: new Date().toISOString().split('T')[0],
        product: '', category: '',
        region: user?.region !== 'all' ? user?.region : '',
        customer: '', quantity: '', unit_price: '', unit_cost: '',
        salesperson: user?.name || '', payment: 'Cash'
      });
      setShowForm(false);
      fetchSales();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // My sales only
  const mySales = sales.filter(s =>
    s.salesperson?.toLowerCase() === user?.name?.toLowerCase()
  );

  const todaySales = mySales.filter(s =>
    s.sale_date?.split('T')[0] === new Date().toISOString().split('T')[0]
  );

  const totalMyRevenue = mySales.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
  const totalMyProfit = mySales.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);

  const filteredSales = mySales.filter(s =>
    search === '' ||
    s.product?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.toLowerCase().includes(search.toLowerCase())
  );

  const KPICard = ({ label, value, color, sub }) => (
    <div style={{ background: 'white', borderRadius: 12, padding: 20,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#3E1F00', fontSize: 20, fontWeight: 'bold' }}>{value}</div>
      {sub && <div style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
            My Dashboard
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Welcome back, {user?.name} · {user?.region !== 'all' ? user?.region : 'All Regions'}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
                   padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 14 }}>
          + New Sale
        </button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        <KPICard label="My Total Revenue"
                 value={`MK ${fmt(totalMyRevenue)}`}
                 color="#FF6B35"
                 sub="All time"/>
        <KPICard label="My Total Profit"
                 value={`MK ${fmt(totalMyProfit)}`}
                 color="#2D6A4F"
                 sub="All time"/>
        <KPICard label="Today's Sales"
                 value={todaySales.length}
                 color="#FFB800"
                 sub={`MK ${fmt(todaySales.reduce((s, x) => s + parseFloat(x.revenue || 0), 0))}`}/>
        <KPICard label="Total Transactions"
                 value={mySales.length}
                 color="#457B9D"
                 sub="All records"/>
      </div>

      {/* New Sale Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        fontSize: 16, marginBottom: 20 }}>
            Record New Sale
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Sale Date', key: 'sale_date', type: 'date' },
                { label: 'Product Name', key: 'product', type: 'text' },
                { label: 'Category', key: 'category', type: 'text' },
                { label: 'Region', key: 'region', type: 'text' },
                { label: 'Customer (optional)', key: 'customer', type: 'text', required: false },
                { label: 'Quantity', key: 'quantity', type: 'number' },
                { label: 'Unit Price (MWK)', key: 'unit_price', type: 'number' },
                { label: 'Unit Cost (MWK)', key: 'unit_cost', type: 'number' },
                { label: 'Salesperson', key: 'salesperson', type: 'text' },
              ].map(({ label, key, type, required = true }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: '#888',
                                  display: 'block', marginBottom: 4 }}>
                    {label}
                  </label>
                  <input type={type} required={required} value={form[key]}
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
                </select>
              </div>
            </div>

            {/* Auto-calculated preview */}
            {form.quantity && form.unit_price && (
              <div style={{ marginTop: 16, background: '#FFF8F0', borderRadius: 8,
                            padding: '12px 16px', display: 'flex', gap: 24 }}>
                <div>
                  <span style={{ color: '#888', fontSize: 12 }}>Revenue: </span>
                  <strong style={{ color: '#2D6A4F' }}>
                    MK {fmt(form.quantity * form.unit_price)}
                  </strong>
                </div>
                {form.unit_cost && (
                  <div>
                    <span style={{ color: '#888', fontSize: 12 }}>Profit: </span>
                    <strong style={{ color: '#FF6B35' }}>
                      MK {fmt(form.quantity * (form.unit_price - form.unit_cost))}
                    </strong>
                  </div>
                )}
                {form.unit_cost && form.unit_price && (
                  <div>
                    <span style={{ color: '#888', fontSize: 12 }}>Margin: </span>
                    <strong style={{ color: '#FFB800' }}>
                      {(((form.unit_price - form.unit_cost) / form.unit_price) * 100).toFixed(1)}%
                    </strong>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                         padding: '10px 28px', borderRadius: 6, cursor: 'pointer',
                         fontWeight: 'bold', fontSize: 14 }}>
                {submitting ? 'Submitting...' : 'Submit Sale'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                         padding: '10px 28px', borderRadius: 6, cursor: 'pointer',
                         fontWeight: 'bold', fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Recent Sales Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            My Sales Records ({filteredSales.length})
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Search product or customer..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13, width: 220 }}/>
            <button onClick={fetchSales}
              style={{ padding: '8px 16px', background: '#FF6B35',
                       border: 'none', borderRadius: 8, color: 'white',
                       cursor: 'pointer', fontSize: 13 }}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading your sales...
          </div>
        ) : filteredSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ color: '#888', fontSize: 14 }}>
              No sales records found. Click New Sale to record your first sale!
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#3E1F00' }}>
                  {['Date','Product','Category','Region','Customer',
                    'Qty','Unit Price','Revenue','Profit','Margin','Payment'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
                      textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, 30).map((s, i) => (
                  <tr key={s.id} style={{
                    background: i % 2 === 0 ? '#FFF8F0' : 'white',
                    borderBottom: '1px solid #FFE8D0' }}>
                    <td style={{ padding: '8px 12px' }}>
                      {s.sale_date?.split('T')[0]}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500',
                                 color: '#3E1F00' }}>{s.product}</td>
                    <td style={{ padding: '8px 12px' }}>{s.category}</td>
                    <td style={{ padding: '8px 12px' }}>{s.region}</td>
                    <td style={{ padding: '8px 12px' }}>{s.customer || 'Walk-in'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {fmt(s.quantity)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      MK {fmt(s.unit_price)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right',
                                 color: '#2D6A4F', fontWeight: '500' }}>
                      MK {fmt(s.revenue)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right',
                                 color: '#FF6B35', fontWeight: '500' }}>
                      MK {fmt(s.profit)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {s.margin ? (parseFloat(s.margin) * 100).toFixed(1) : 0}%
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
        )}
      </div>
    </div>
  );
}