import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function MySales({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('All');

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

  const mySales = sales.filter(s =>
    s.salesperson?.toLowerCase() === user?.name?.toLowerCase()
  );

  const filtered = mySales.filter(s => {
    const matchSearch = search === '' ||
      s.product?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase()) ||
      s.region?.toLowerCase().includes(search.toLowerCase());
    const matchPayment = filterPayment === 'All' || s.payment === filterPayment;
    return matchSearch && matchPayment;
  });

  const totalRevenue = filtered.reduce((sum, s) =>
    sum + parseFloat(s.revenue || 0), 0);
  const totalProfit = filtered.reduce((sum, s) =>
    sum + parseFloat(s.profit || 0), 0);
  const totalUnits = filtered.reduce((sum, s) =>
    sum + parseInt(s.quantity || 0), 0);

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>My Sales History</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          All your recorded sales transactions
        </p>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Filtered Revenue', value: `MK ${fmt(totalRevenue)}`, color: '#FF6B35' },
          { label: 'Filtered Profit', value: `MK ${fmt(totalProfit)}`, color: '#2D6A4F' },
          { label: 'Total Units', value: fmt(totalUnits), color: '#FFB800' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 10,
            padding: '16px 20px', borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 18, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16,
                      flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            My Records ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Search product, customer, region..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13, width: 240 }}/>
            <select value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13 }}>
              <option>All</option>
              <option>Cash</option>
              <option>Mobile Money</option>
              <option>Credit</option>
              <option>Bank Transfer</option>
            </select>
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ color: '#888' }}>No sales records found.</div>
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
                {filtered.map((s, i) => (
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
                    <td style={{ padding: '8px 12px' }}>
                      {s.customer || 'Walk-in'}
                    </td>
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
                      {s.margin
                        ? (parseFloat(s.margin) * 100).toFixed(1) : 0}%
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