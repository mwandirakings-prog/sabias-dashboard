import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function ViewerReports({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const printRef = useRef();

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchAll = useCallback(async () => {
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredSales = sales.filter(s => {
    const matchRegion = filterRegion === 'All' || s.region === filterRegion;
    const matchCategory = filterCategory === 'All' ||
      s.category === filterCategory;
    const matchFrom = !dateFrom || s.sale_date?.split('T')[0] >= dateFrom;
    const matchTo = !dateTo || s.sale_date?.split('T')[0] <= dateTo;
    return matchRegion && matchCategory && matchFrom && matchTo;
  });

  const uniqueRegions = ['All',
    ...new Set(sales.map(s => s.region).filter(Boolean))];
  const uniqueCategories = ['All',
    ...new Set(sales.map(s => s.category).filter(Boolean))];

  const totalRevenue = filteredSales.reduce((sum, s) =>
    sum + parseFloat(s.revenue || 0), 0);
  const totalProfit = filteredSales.reduce((sum, s) =>
    sum + parseFloat(s.profit || 0), 0);
  const margin = totalRevenue > 0
    ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const printReport = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SABIAS Report — ${user?.company || 'Sales Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #2C3E50; }
            .meta { color: #888; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #2C3E50; color: #4CC9F0; padding: 8px 10px; text-align: left; }
            td { padding: 7px 10px; border-bottom: 1px solid #D6EAF8; }
            tr:nth-child(even) { background: #EBF5FB; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; }
            .kpi { border-left: 4px solid #2980B9; padding: 10px 14px;
                   background: #EBF5FB; border-radius: 6px; }
            .kpi-label { font-size: 11px; color: #888; }
            .kpi-value { font-size: 16px; font-weight: bold; color: #2C3E50; }
          </style>
        </head>
        <body>
          <h2>SABIAS Sales Report — ${user?.company || ''}</h2>
          <div class="meta">
            Generated: ${new Date().toLocaleString()} |
            Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'} |
            Branch: ${filterRegion} | Category: ${filterCategory}
          </div>
          <div class="summary">
            <div class="kpi"><div class="kpi-label">Transactions</div>
              <div class="kpi-value">${filteredSales.length}</div></div>
            <div class="kpi"><div class="kpi-label">Total Revenue</div>
              <div class="kpi-value">MK ${fmt(totalRevenue)}</div></div>
            <div class="kpi"><div class="kpi-label">Total Profit</div>
              <div class="kpi-value">MK ${fmt(totalProfit)}</div></div>
            <div class="kpi"><div class="kpi-label">Profit Margin</div>
              <div class="kpi-value">${margin}%</div></div>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#2C3E50', fontSize: 18 }}>
      Loading Reports...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#2C3E50', margin: 0, fontSize: 22 }}>Reports</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Sales reports for{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong> — read only
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ color: '#2C3E50', fontWeight: 'bold',
                      marginBottom: 16, fontSize: 15 }}>
          Report Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 14 }}>
          {[
            { label: 'Date From', value: dateFrom, type: 'date',
              set: setDateFrom },
            { label: 'Date To', value: dateTo, type: 'date',
              set: setDateTo },
          ].map(({ label, value, type, set }) => (
            <div key={label}>
              <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                              display: 'block', marginBottom: 6 }}>
                {label}
              </label>
              <input type={type} value={value}
                onChange={(e) => set(e.target.value)}
                style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                         border: '1.5px solid #2980B9', fontSize: 13,
                         boxSizing: 'border-box' }}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                            display: 'block', marginBottom: 6 }}>Branch</label>
            <select value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                       border: '1.5px solid #2980B9', fontSize: 13,
                       boxSizing: 'border-box' }}>
              {uniqueRegions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                            display: 'block', marginBottom: 6 }}>Category</label>
            <select value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                       border: '1.5px solid #2980B9', fontSize: 13,
                       boxSizing: 'border-box' }}>
              {uniqueCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => {
          setDateFrom(''); setDateTo('');
          setFilterRegion('All'); setFilterCategory('All');
        }}
          style={{ marginTop: 12, background: 'none',
                   border: '1px solid #2980B9', color: '#2C3E50',
                   padding: '6px 16px', borderRadius: 6,
                   cursor: 'pointer', fontSize: 12 }}>
          Clear Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Transactions', value: filteredSales.length, color: '#2980B9' },
          { label: 'Total Revenue', value: `MK ${fmt(totalRevenue)}`, color: '#2D6A4F' },
          { label: 'Total Profit', value: `MK ${fmt(totalProfit)}`, color: '#FFB800' },
          { label: 'Profit Margin', value: `${margin}%`, color: '#9B5DE5' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#2C3E50', fontSize: 18,
                          fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', background: '#EBF5FB',
                    borderRadius: 10, padding: '12px 16px',
                    border: '1px solid #D6EAF8', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ color: '#1565C0', fontSize: 13 }}>
            Read-only access. Contact Admin to export CSV reports.
          </span>
        </div>
        <button onClick={printReport}
          style={{ background: '#2C3E50', border: 'none', color: '#4CC9F0',
                   padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 13 }}>
          Print Report
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ color: '#2C3E50', fontWeight: 'bold',
                      fontSize: 15, marginBottom: 16 }}>
          Sales Report — {filteredSales.length} Records
        </div>
        <div ref={printRef} style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse',
                          fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#2C3E50' }}>
                {['Date','Product','Category','Branch','Customer',
                  'Qty','Revenue','Profit','Salesperson','Payment'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#4CC9F0',
                    textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 20).map((s, i) => (
                <tr key={s.id} style={{
                  background: i % 2 === 0 ? '#EBF5FB' : 'white',
                  borderBottom: '1px solid #D6EAF8' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {s.sale_date?.split('T')[0]}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: '500',
                               color: '#2C3E50' }}>{s.product}</td>
                  <td style={{ padding: '8px 12px' }}>{s.category}</td>
                  <td style={{ padding: '8px 12px' }}>{s.region}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {s.customer || 'Walk-in'}
                  </td>
                  <td style={{ padding: '8px 12px',
                               textAlign: 'right' }}>{s.quantity}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right',
                               color: '#2D6A4F', fontWeight: '500' }}>
                    MK {fmt(s.revenue)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right',
                               color: '#2980B9', fontWeight: '500' }}>
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
          {filteredSales.length > 20 && (
            <div style={{ textAlign: 'center', padding: 12, color: '#888',
                          fontSize: 12, borderTop: '1px solid #D6EAF8' }}>
              Showing 20 of {filteredSales.length} records.
              Contact Admin to export all records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}