import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const API = 'https://api.sabiasanalytics.com';
const COLORS = ['#FF6B35','#FFB800','#2D6A4F','#3E1F00','#E63946',
                '#457B9D','#9B5DE5','#F72585','#4CC9F0','#7B2D8B'];

export default function AdminDashboard({ token, user }) {
  const [kpis, setKpis] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendFilter, setTrendFilter] = useState('Monthly');
  const [productFilter, setProductFilter] = useState('Top 10');

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
      setBranches(r.data.data.map(b => ({ ...b, branch: b.region })));
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

  const getTrendData = () => {
    switch (trendFilter) {
      case 'Daily':
        return sales.reduce((acc, s) => {
          const d = s.sale_date?.split('T')[0];
          const found = acc.find(x => x.period === d);
          if (found) { found.revenue += parseFloat(s.revenue || 0); found.profit += parseFloat(s.profit || 0); }
          else acc.push({ period: d, revenue: parseFloat(s.revenue || 0), profit: parseFloat(s.profit || 0) });
          return acc;
        }, []).sort((a, b) => a.period > b.period ? 1 : -1).slice(-14);
      case 'Weekly':
        return sales.reduce((acc, s) => {
          const d = new Date(s.sale_date);
          const week = `W${Math.ceil(d.getDate()/7)}-${d.getMonth()+1}/${d.getFullYear()}`;
          const found = acc.find(x => x.period === week);
          if (found) { found.revenue += parseFloat(s.revenue || 0); found.profit += parseFloat(s.profit || 0); }
          else acc.push({ period: week, revenue: parseFloat(s.revenue || 0), profit: parseFloat(s.profit || 0) });
          return acc;
        }, []).slice(-12);
      case 'Quarterly':
        return sales.reduce((acc, s) => {
          const d = new Date(s.sale_date);
          const q = `Q${Math.ceil((d.getMonth()+1)/3)}-${d.getFullYear()}`;
          const found = acc.find(x => x.period === q);
          if (found) { found.revenue += parseFloat(s.revenue || 0); found.profit += parseFloat(s.profit || 0); }
          else acc.push({ period: q, revenue: parseFloat(s.revenue || 0), profit: parseFloat(s.profit || 0) });
          return acc;
        }, []);
      case 'Yearly':
        return sales.reduce((acc, s) => {
          const y = new Date(s.sale_date).getFullYear().toString();
          const found = acc.find(x => x.period === y);
          if (found) { found.revenue += parseFloat(s.revenue || 0); found.profit += parseFloat(s.profit || 0); }
          else acc.push({ period: y, revenue: parseFloat(s.revenue || 0), profit: parseFloat(s.profit || 0) });
          return acc;
        }, []);
      default:
        return monthly.map(m => ({ period: m.month?.slice(5), revenue: parseFloat(m.revenue || 0), profit: parseFloat(m.profit || 0) }));
    }
  };

  const trendData = getTrendData();

  const allProducts = sales.reduce((acc, s) => {
    const found = acc.find(x => x.name === s.product);
    if (found) { found.value += parseFloat(s.revenue || 0); }
    else acc.push({ name: s.product, value: parseFloat(s.revenue || 0) });
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const displayProducts = productFilter === 'Top 10' ? allProducts.slice(0, 10)
    : productFilter === 'Top 5' ? allProducts.slice(0, 5) : allProducts.slice(-5);

  const KPICard = ({ label, value, color }) => (
    <div style={{ background: 'white', borderRadius: 12, padding: 16,
      borderLeft: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#3E1F00', fontSize: 18, fontWeight: 'bold' }}>{value}</div>
    </div>
  );

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Dashboard...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>Business Overview</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Real-time intelligence for{' '}
          <strong style={{ color: '#FF6B35' }}>{user?.company || 'Your Company'}</strong>
        </p>
      </div>

      {/* KPI Cards — 2 cols on mobile, 4 on desktop */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 12 }}>
        <KPICard label="Total Revenue" value={`MK ${fmt(kpis?.total_revenue)}`} color="#FF6B35"/>
        <KPICard label="Total Profit" value={`MK ${fmt(kpis?.total_profit)}`} color="#2D6A4F"/>
        <KPICard label="Profit Margin" value={`${margin}%`} color="#FFB800"/>
        <KPICard label="Total Records" value={fmt(kpis?.total_records)} color="#457B9D"/>
      </div>
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        <KPICard label="Units Sold" value={fmt(kpis?.total_units)} color="#9B5DE5"/>
        <KPICard label="Avg Unit Price" value={`MK ${fmt(kpis?.avg_unit_price)}`} color="#E63946"/>
        <KPICard label="Active Branches" value={branches.length} color="#3E1F00"/>
        <KPICard label="Categories" value={categories.length} color="#FF6B35"/>
      </div>

      {/* Charts — stack on mobile */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 12, fontSize: 14 }}>
            Revenue by Branch
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branches} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="branch" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`, 'Revenue']}/>
              <Bar dataKey="revenue" fill="#FF6B35" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 14 }}>
              Revenue & Profit Trend
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {['Daily','Weekly','Monthly','Quarterly','Yearly'].map(f => (
                <button key={f} onClick={() => setTrendFilter(f)}
                  style={{ padding: '3px 6px', borderRadius: 6, border: 'none',
                    cursor: 'pointer', fontSize: 9, fontWeight: 'bold',
                    background: trendFilter === f ? '#3E1F00' : '#FFF8F0',
                    color: trendFilter === f ? '#FFB800' : '#888' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="period" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v, name) => [`MK ${fmt(v)}`, name]}/>
              <Legend/>
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#FF6B35" strokeWidth={2} dot={{ r: 2 }}/>
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 2 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 12, fontSize: 14 }}>
            Revenue vs Profit by Branch
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branches} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="branch" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`]}/>
              <Legend/>
              <Bar dataKey="revenue" name="Revenue" fill="#FF6B35" radius={[4,4,0,0]}/>
              <Bar dataKey="profit" name="Profit" fill="#2D6A4F" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 14 }}>
              Products by Revenue
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {['Top 10','Top 5','Least 5'].map(f => (
                <button key={f} onClick={() => setProductFilter(f)}
                  style={{ padding: '3px 6px', borderRadius: 6, border: 'none',
                    cursor: 'pointer', fontSize: 9, fontWeight: 'bold',
                    background: productFilter === f ? '#3E1F00' : '#FFF8F0',
                    color: productFilter === f ? '#FFB800' : '#888' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={displayProducts} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={75} innerRadius={0}>
                {displayProducts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`, 'Revenue']}/>
              <Legend formatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
