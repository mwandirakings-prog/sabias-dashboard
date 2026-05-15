import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const API = 'https://malawi-sales-backend.onrender.com';
const COLORS = ['#FF6B35','#FFB800','#2D6A4F','#3E1F00','#E63946','#457B9D','#9B5DE5','#F72585','#4CC9F0','#7B2D8B'];

export default function AdminDashboard({ token }) {
  const [kpis, setKpis] = useState(null);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [k, r, c, m, s] = await Promise.all([
        axios.get(`${API}/api/kpis`, h),
        axios.get(`${API}/api/regions`, h),
        axios.get(`${API}/api/categories`, h),
        axios.get(`${API}/api/monthly`, h),
        axios.get(`${API}/api/sales`, h),
      ]);
      setKpis(k.data.data);
      setRegions(r.data.data);
      setCategories(c.data.data);
      setMonthly(m.data.data);
      setSales(s.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const margin = kpis?.total_profit && kpis?.total_revenue
    ? ((kpis.total_profit / kpis.total_revenue) * 100).toFixed(1) : 0;

  const filteredSales = sales.filter(s => {
    const matchSearch = search === '' ||
      s.product?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase()) ||
      s.salesperson?.toLowerCase().includes(search.toLowerCase());
    const matchRegion = filterRegion === 'All' || s.region === filterRegion;
    return matchSearch && matchRegion;
  });

  const uniqueRegions = ['All', ...new Set(sales.map(s => s.region).filter(Boolean))];

  const top10Products = sales
    .reduce((acc, s) => {
      const found = acc.find(x => x.name === s.product);
      if (found) {
        found.value += parseFloat(s.revenue || 0);
      } else {
        acc.push({ name: s.product, value: parseFloat(s.revenue || 0) });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const KPICard = ({ label, value, color }) => (
    <div style={{ background: 'white', borderRadius: 12, padding: 20,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#3E1F00', fontSize: 20, fontWeight: 'bold' }}>{value}</div>
    </div>
  );

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Admin Dashboard...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Business Overview
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Real-time business intelligence and analytics
        </p>
      </div>

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 16 }}>
        <KPICard label="Total Revenue"
                 value={`MK ${fmt(kpis?.total_revenue)}`}
                 color="#FF6B35"/>
        <KPICard label="Total Profit"
                 value={`MK ${fmt(kpis?.total_profit)}`}
                 color="#2D6A4F"/>
        <KPICard label="Profit Margin"
                 value={`${margin}%`}
                 color="#FFB800"/>
        <KPICard label="Total Records"
                 value={fmt(kpis?.total_records)}
                 color="#457B9D"/>
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        <KPICard label="Total Units Sold"
                 value={fmt(kpis?.total_units)}
                 color="#9B5DE5"/>
        <KPICard label="Avg Unit Price"
                 value={`MK ${fmt(kpis?.avg_unit_price)}`}
                 color="#E63946"/>
        <KPICard label="Active Regions"
                 value={regions.length}
                 color="#3E1F00"/>
        <KPICard label="Product Categories"
                 value={categories.length}
                 color="#FF6B35"/>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 16 }}>

        {/* Revenue by Region */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 16 }}>
            Revenue by Region
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regions}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="region" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`, 'Revenue']}/>
              <Bar dataKey="revenue" fill="#FF6B35" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend Line Chart */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 16 }}>
            Monthly Revenue and Profit Trend
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 10 }}
                     tickFormatter={(v) => v?.slice(5)}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}/>
              <Tooltip
                formatter={(v, name) => [`MK ${fmt(v)}`, name]}
                labelFormatter={(l) => `Month: ${l}`}/>
              <Legend/>
              <Line type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#FF6B35" strokeWidth={2.5}
                    dot={{ fill: '#FF6B35', r: 4 }}
                    activeDot={{ r: 6 }}/>
              <Line type="monotone" dataKey="profit" name="Profit"
                    stroke="#2D6A4F" strokeWidth={2.5}
                    dot={{ fill: '#2D6A4F', r: 4 }}
                    activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 24 }}>

        {/* Revenue vs Profit by Region */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 16 }}>
            Revenue vs Profit by Region
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regions}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="region" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`]}/>
              <Legend/>
              <Bar dataKey="revenue" name="Revenue"
                   fill="#FF6B35" radius={[4,4,0,0]}/>
              <Bar dataKey="profit" name="Profit"
                   fill="#2D6A4F" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Products Pie Chart */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 4 }}>
            Top 10 Products by Revenue
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Highest revenue generating products
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={top10Products} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={85} innerRadius={0}>
                {top10Products.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`, 'Revenue']}/>
              <Legend formatter={(value) =>
                value.length > 14 ? value.slice(0, 14) + '...' : value}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16,
                      flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            All Sales Records ({filteredSales.length})
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="Search product, customer, salesperson..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13, width: 240 }}/>
            <select value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13 }}>
              {uniqueRegions.map(r => <option key={r}>{r}</option>)}
            </select>
            <button onClick={fetchAll}
              style={{ padding: '8px 16px', background: '#FF6B35',
                       border: 'none', borderRadius: 8, color: 'white',
                       cursor: 'pointer', fontSize: 13 }}>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#3E1F00' }}>
                {['#','Date','Product','Category','Region','Customer',
                  'Qty','Revenue','Profit','Margin','Salesperson','Payment'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
                    textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 50).map((s, i) => (
                <tr key={s.id} style={{
                  background: i % 2 === 0 ? '#FFF8F0' : 'white',
                  borderBottom: '1px solid #FFE8D0' }}>
                  <td style={{ padding: '8px 12px', color: '#888' }}>{s.id}</td>
                  <td style={{ padding: '8px 12px' }}>{s.sale_date?.split('T')[0]}</td>
                  <td style={{ padding: '8px 12px', fontWeight: '500',
                               color: '#3E1F00' }}>{s.product}</td>
                  <td style={{ padding: '8px 12px' }}>{s.category}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: '#FFF3E0', color: '#E65100',
                                   padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                      {s.region}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>{s.customer || 'Walk-in'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    {fmt(s.quantity)}
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
                  <td style={{ padding: '8px 12px' }}>{s.salesperson}</td>
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
      </div>
    </div>
  );
}