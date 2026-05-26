import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie,
  Cell, Legend, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

/* eslint-disable */
const API = 'https://malawi-sales-backend.onrender.com';
const COLORS = ['#FF6B35','#FFB800','#2D6A4F','#3E1F00','#E63946',
                '#457B9D','#9B5DE5','#F72585','#4CC9F0','#7B2D8B'];

export default function Analytics({ token, user }) {
  const [sales, setSales] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('Top 5');

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [s, m, r, c] = await Promise.all([
        axios.get(`${API}/api/sales`, h),
        axios.get(`${API}/api/monthly`, h),
        axios.get(`${API}/api/regions`, h),
        axios.get(`${API}/api/categories`, h),
      ]);
      setSales(s.data.data);
      setMonthly(m.data.data);
      setRegions(r.data.data);
      setCategories(c.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allProducts = sales
    .reduce((acc, s) => {
      const found = acc.find(x => x.name === s.product);
      if (found) {
        found.revenue += parseFloat(s.revenue || 0);
        found.profit += parseFloat(s.profit || 0);
        found.units += parseInt(s.quantity || 0);
      } else {
        acc.push({
          name: s.product,
          revenue: parseFloat(s.revenue || 0),
          profit: parseFloat(s.profit || 0),
          units: parseInt(s.quantity || 0),
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.revenue - a.revenue);

  const displayProducts = productFilter === 'Top 5'
    ? allProducts.slice(0, 5)
    : productFilter === 'Top 10'
    ? allProducts.slice(0, 10)
    : allProducts.slice(-5);

  const salespersonData = sales
    .reduce((acc, s) => {
      const found = acc.find(x => x.name === s.salesperson);
      if (found) {
        found.revenue += parseFloat(s.revenue || 0);
        found.profit += parseFloat(s.profit || 0);
        found.transactions += 1;
      } else {
        acc.push({
          name: s.salesperson,
          revenue: parseFloat(s.revenue || 0),
          profit: parseFloat(s.profit || 0),
          transactions: 1,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.revenue - a.revenue);

  const paymentData = sales
    .reduce((acc, s) => {
      const found = acc.find(x => x.name === s.payment);
      if (found) {
        found.value += parseFloat(s.revenue || 0);
        found.count += 1;
      } else {
        acc.push({
          name: s.payment,
          value: parseFloat(s.revenue || 0),
          count: 1,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const monthlyWithGrowth = monthly.map((m, i) => {
    if (i === 0) return { ...m, growth: 0 };
    const prev = parseFloat(monthly[i - 1].revenue || 0);
    const curr = parseFloat(m.revenue || 0);
    const growth = prev > 0
      ? (((curr - prev) / prev) * 100).toFixed(1) : 0;
    return { ...m, growth: parseFloat(growth) };
  });

  const radarData = regions.map(r => ({
    region: r.region,
    revenue: Math.round(parseFloat(r.revenue || 0) / 1000),
    profit: Math.round(parseFloat(r.profit || 0) / 1000),
    records: parseInt(r.records || 0),
  }));

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#3E1F00', fontSize: 18 }}>
      Loading Analytics...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
          Advanced Analytics
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Deep insights into sales performance, trends and growth
        </p>
      </div>

      {/* Charts row 1 — stack on mobile */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        marginBottom: 4, fontSize: 14 }}>
            Revenue & Profit Trend
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
            Monthly area comparison
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 9 }}
                     tickFormatter={(v) => v?.slice(5)}/>
              <YAxis tick={{ fontSize: 9 }}
                     tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v, n) => [`MK ${fmt(v)}`, n]}/>
              <Legend/>
              <Area type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#FF6B35" fill="url(#revGrad)" strokeWidth={2}/>
              <Area type="monotone" dataKey="profit" name="Profit"
                    stroke="#2D6A4F" fill="url(#profGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        marginBottom: 4, fontSize: 14 }}>
            Monthly Revenue Growth Rate
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
            Month over month % change
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyWithGrowth}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 9 }}
                     tickFormatter={(v) => v?.slice(5)}/>
              <YAxis tick={{ fontSize: 9 }}
                     tickFormatter={(v) => `${v}%`}/>
              <Tooltip formatter={(v) => [`${v}%`, 'Growth Rate']}/>
              <Bar dataKey="growth" name="Growth %" radius={[4,4,0,0]}>
                {monthlyWithGrowth.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.growth >= 0 ? '#2D6A4F' : '#E63946'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 4,
                        flexWrap: 'wrap', gap: 6 }}>
            <div style={{ color: '#3E1F00', fontWeight: 'bold',
                          fontSize: 14 }}>
              Products by Revenue
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Top 5', 'Top 10', 'Least 5'].map(f => (
                <button key={f} onClick={() => setProductFilter(f)}
                  style={{ padding: '3px 7px', borderRadius: 6,
                    border: 'none', cursor: 'pointer', fontSize: 9,
                    fontWeight: 'bold',
                    background: productFilter === f ? '#3E1F00' : '#FFF8F0',
                    color: productFilter === f ? '#FFB800' : '#888' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
            {productFilter === 'Least 5' ? 'Lowest' : 'Highest'} revenue products
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={displayProducts} layout="vertical"
              margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis type="number" tick={{ fontSize: 9 }}
                     tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`, 'Revenue']}/>
              <Bar dataKey="revenue" radius={[0,4,4,0]}>
                {displayProducts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        marginBottom: 4, fontSize: 14 }}>
            Payment Method Analysis
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
            Revenue by payment type
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentData} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`, 'Revenue']}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 3 */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        marginBottom: 4, fontSize: 14 }}>
            Branch Performance Radar
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
            Revenue vs Profit by branch (MK thousands)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid/>
              <PolarAngleAxis dataKey="region" tick={{ fontSize: 10 }}/>
              <PolarRadiusAxis tick={{ fontSize: 9 }}/>
              <Radar name="Revenue (K)" dataKey="revenue"
                     stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.3}/>
              <Radar name="Profit (K)" dataKey="profit"
                     stroke="#2D6A4F" fill="#2D6A4F" fillOpacity={0.3}/>
              <Legend/>
              <Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        marginBottom: 4, fontSize: 14 }}>
            Category Performance
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>
            Revenue and profit by category
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categories}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="category" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 9 }}
                     tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`]}/>
              <Legend/>
              <Bar dataKey="revenue" name="Revenue"
                   fill="#FF6B35" radius={[4,4,0,0]}/>
              <Bar dataKey="profit" name="Profit"
                   fill="#2D6A4F" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Salesperson Leaderboard */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                      fontSize: 15, marginBottom: 14 }}>
          Salesperson Leaderboard
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse',
                          fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#3E1F00' }}>
                {['Rank','Salesperson','Transactions','Revenue',
                  'Profit','Margin','Performance'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
                    textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salespersonData.map((sp, i) => {
                const margin = sp.revenue > 0
                  ? ((sp.profit / sp.revenue) * 100).toFixed(1) : 0;
                const maxRevenue = salespersonData[0]?.revenue || 1;
                const pct = ((sp.revenue / maxRevenue) * 100).toFixed(0);
                return (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? '#FFF8F0' : 'white',
                    borderBottom: '1px solid #FFE8D0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: i === 0 ? '#FFB800'
                          : i === 1 ? '#C0C0C0'
                          : i === 2 ? '#CD7F32' : '#EEE',
                        color: i < 3 ? 'white' : '#888',
                        width: 26, height: 26, borderRadius: '50%',
                        display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 'bold',
                        fontSize: 11 }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '600',
                                 color: '#3E1F00' }}>
                      {sp.name || 'Unknown'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {sp.transactions}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#2D6A4F',
                                 fontWeight: '500' }}>
                      MK {fmt(sp.revenue)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#FF6B35',
                                 fontWeight: '500' }}>
                      MK {fmt(sp.profit)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{margin}%</td>
                    <td style={{ padding: '10px 12px', minWidth: 100 }}>
                      <div style={{ background: '#FFE8D0', borderRadius: 10,
                                    height: 7, overflow: 'hidden' }}>
                        <div style={{ background: '#FF6B35', height: '100%',
                          width: `${pct}%`, borderRadius: 10,
                          transition: 'width 0.5s ease' }}/>
                      </div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        {pct}% of top
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}