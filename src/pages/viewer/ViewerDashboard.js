import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const API = 'https://api.sabiasanalytics.com';
const COLORS = ['#FF6B35','#FFB800','#2D6A4F','#3E1F00','#E63946','#457B9D','#9B5DE5','#F72585','#4CC9F0','#7B2D8B'];

export default function ViewerDashboard({ token, user }) {
  const [kpis, setKpis] = useState(null);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const KPICard = ({ label, value, color, sub }) => (
    <div style={{ background: 'white', borderRadius: 12, padding: 20,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#3E1F00', fontSize: 20, fontWeight: 'bold' }}>{value}</div>
      {sub && <div style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Business Overview...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1',
                    borderRadius: 10, padding: '10px 16px', marginBottom: 24,
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center' }}>
        <div style={{ color: '#2980B9', fontSize: 13 }}>
          You are in <strong>View-Only</strong> mode for{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong>. You can monitor and analyze but cannot modify data.
        </div>
        <button onClick={fetchAll}
          style={{ background: '#2980B9', border: 'none', color: 'white',
                   padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                   fontSize: 12 }}>
          Refresh
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Business Intelligence Overview
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Welcome, <strong style={{ color: '#FF6B35' }}>{user?.name}</strong>
          {' '}· Read-only access · {user?.company || 'Your Company'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 16 }}>
        <KPICard label="Total Revenue"
                 value={`MK ${fmt(kpis?.total_revenue)}`}
                 color="#FF6B35" sub="All time"/>
        <KPICard label="Total Profit"
                 value={`MK ${fmt(kpis?.total_profit)}`}
                 color="#2D6A4F" sub="All time"/>
        <KPICard label="Profit Margin"
                 value={`${margin}%`}
                 color="#FFB800" sub="Overall"/>
        <KPICard label="Total Records"
                 value={fmt(kpis?.total_records)}
                 color="#457B9D" sub="Transactions"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        <KPICard label="Units Sold"
                 value={fmt(kpis?.total_units)}
                 color="#9B5DE5" sub="All products"/>
        <KPICard label="Avg Unit Price"
                 value={`MK ${fmt(kpis?.avg_unit_price)}`}
                 color="#E63946" sub="Across all sales"/>
        <KPICard label="Active Branches"
                 value={regions.length}
                 color="#3E1F00" sub="Coverage areas"/>
        <KPICard label="Product Categories"
                 value={categories.length}
                 color="#FF6B35" sub="Distinct categories"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 16 }}>
            Revenue by Branch
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
              <Tooltip formatter={(v, name) => [`MK ${fmt(v)}`, name]}/>
              <Legend/>
              <Line type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#FF6B35" strokeWidth={2.5}
                    dot={{ fill: '#FF6B35', r: 4 }} activeDot={{ r: 6 }}/>
              <Line type="monotone" dataKey="profit" name="Profit"
                    stroke="#2D6A4F" strokeWidth={2.5}
                    dot={{ fill: '#2D6A4F', r: 4 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 16 }}>
            Revenue vs Profit by Branch
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

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                      fontSize: 15, marginBottom: 16 }}>
          Category Performance Summary
        </div>
        <div style={{ display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {categories.sort((a, b) => b.revenue - a.revenue).map((cat, i) => (
            <div key={i} style={{ border: '1px solid #D6EAF8',
                                  borderRadius: 10, padding: 16,
                                  background: '#F4F9FF' }}>
              <div style={{ color: '#2C3E50', fontWeight: 'bold',
                            fontSize: 14, marginBottom: 10 }}>
                {cat.category}
              </div>
              <div style={{ display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#AAA' }}>Revenue</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold',
                                color: '#FF6B35' }}>
                    MK {fmt(cat.revenue)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#AAA' }}>Profit</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold',
                                color: '#2D6A4F' }}>
                    MK {fmt(cat.profit)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#AAA' }}>Records</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold',
                                color: '#457B9D' }}>
                    {cat.records}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#AAA' }}>Margin</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold',
                                color: '#FFB800' }}>
                    {cat.revenue > 0
                      ? ((cat.profit / cat.revenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}