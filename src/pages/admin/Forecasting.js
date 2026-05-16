import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';

const API = 'https://malawi-sales-backend.onrender.com';
const COLORS = ['#FF6B35','#FFB800','#2D6A4F','#3E1F00','#E63946','#457B9D'];

export default function Forecasting({ token }) {
  const [monthly, setMonthly] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('');
  const [savedTarget, setSavedTarget] = useState(500000);

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [m, s] = await Promise.all([
        axios.get(`${API}/api/monthly`, h),
        axios.get(`${API}/api/sales`, h),
      ]);
      setMonthly(m.data.data);
      setSales(s.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Simple linear regression forecast
  const generateForecast = (data, months = 3) => {
    if (data.length < 2) return [];
    const n = data.length;
    const revenues = data.map((d, i) => ({
      x: i, y: parseFloat(d.revenue || 0)
    }));
    const sumX = revenues.reduce((s, p) => s + p.x, 0);
    const sumY = revenues.reduce((s, p) => s + p.y, 0);
    const sumXY = revenues.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = revenues.reduce((s, p) => s + p.x * p.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecasts = [];
    for (let i = 1; i <= months; i++) {
      const x = n - 1 + i;
      const predicted = Math.max(0, slope * x + intercept);
      const lastMonth = data[data.length - 1]?.month || '2026-01';
      const [year, month] = lastMonth.split('-').map(Number);
      const newMonth = month + i > 12
        ? `${year + 1}-${String(month + i - 12).padStart(2, '0')}`
        : `${year}-${String(month + i).padStart(2, '0')}`;
      forecasts.push({
        month: newMonth,
        revenue: Math.round(predicted),
        profit: Math.round(predicted * 0.17),
        forecast: true,
      });
    }
    return forecasts;
  };

  const forecast3 = generateForecast(monthly, 3);
  const forecast6 = generateForecast(monthly, 6);

  // Combined chart data — actual + forecast
  const chartData = [
    ...monthly.map(m => ({
      ...m,
      revenue: parseFloat(m.revenue || 0),
      profit: parseFloat(m.profit || 0),
      forecast: false,
    })),
    ...forecast3,
  ];

  // Growth rates
  const growthRates = monthly.map((m, i) => {
    if (i === 0) return { month: m.month, growth: 0 };
    const prev = parseFloat(monthly[i-1].revenue || 0);
    const curr = parseFloat(m.revenue || 0);
    return {
      month: m.month?.slice(5),
      growth: prev > 0 ? parseFloat(((curr - prev) / prev * 100).toFixed(1)) : 0
    };
  });

  const avgGrowth = growthRates.length > 1
    ? (growthRates.slice(1).reduce((s, g) => s + g.growth, 0) /
       (growthRates.length - 1)).toFixed(1) : 0;

  // Top products by demand
  const productDemand = sales
    .reduce((acc, s) => {
      const found = acc.find(x => x.product === s.product);
      if (found) {
        found.units += parseInt(s.quantity || 0);
        found.revenue += parseFloat(s.revenue || 0);
      } else {
        acc.push({
          product: s.product,
          units: parseInt(s.quantity || 0),
          revenue: parseFloat(s.revenue || 0),
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.units - a.units)
    .slice(0, 6);

  // Latest actual revenue
  const latestRevenue = parseFloat(monthly[monthly.length - 1]?.revenue || 0);
  const nextMonthForecast = forecast3[0]?.revenue || 0;
  const targetProgress = savedTarget > 0
    ? ((latestRevenue / savedTarget) * 100).toFixed(1) : 0;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#3E1F00', fontSize: 18 }}>
      Loading Forecasting...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Forecasting & Predictive Analytics
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          AI-powered sales forecasting and business projections
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Latest Month Revenue', value: `MK ${fmt(latestRevenue)}`,
            color: '#FF6B35', sub: 'Most recent' },
          { label: 'Next Month Forecast', value: `MK ${fmt(nextMonthForecast)}`,
            color: '#2D6A4F', sub: 'Predicted' },
          { label: 'Avg Monthly Growth', value: `${avgGrowth}%`,
            color: '#FFB800', sub: 'Historical average' },
          { label: 'Forecast Confidence', value: monthly.length >= 3 ? 'High' : 'Low',
            color: '#457B9D', sub: `Based on ${monthly.length} months` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 18,
                          fontWeight: 'bold' }}>{value}</div>
            <div style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Target Tracker */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
              Monthly Revenue Target Tracker
            </div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              Set your target and track progress
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" placeholder="Set target (MWK)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1.5px solid #FFB800', fontSize: 13, width: 180 }}/>
            <button onClick={() => {
              if (target) { setSavedTarget(parseFloat(target)); setTarget(''); }
            }}
              style={{ background: '#FF6B35', border: 'none', color: 'white',
                       padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                       fontWeight: 'bold', fontSize: 13 }}>
              Set Target
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          marginBottom: 8 }}>
              <span style={{ color: '#888', fontSize: 13 }}>
                Current: MK {fmt(latestRevenue)}
              </span>
              <span style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 13 }}>
                Target: MK {fmt(savedTarget)}
              </span>
            </div>
            <div style={{ background: '#FFE8D0', borderRadius: 10,
                          height: 16, overflow: 'hidden' }}>
              <div style={{
                background: parseFloat(targetProgress) >= 100
                  ? '#2D6A4F' : parseFloat(targetProgress) >= 70
                  ? '#FFB800' : '#FF6B35',
                height: '100%',
                width: `${Math.min(100, parseFloat(targetProgress))}%`,
                borderRadius: 10, transition: 'width 0.5s ease'
              }}/>
            </div>
            <div style={{ textAlign: 'center', marginTop: 6,
                          color: '#3E1F00', fontWeight: 'bold', fontSize: 14 }}>
              {targetProgress}% of target achieved
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#FFF8F0', borderRadius: 8, padding: 12,
                          textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888' }}>Remaining</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#E63946' }}>
                MK {fmt(Math.max(0, savedTarget - latestRevenue))}
              </div>
            </div>
            <div style={{ background: '#FFF8F0', borderRadius: 8, padding: 12,
                          textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888' }}>Status</div>
              <div style={{ fontSize: 15, fontWeight: 'bold',
                color: parseFloat(targetProgress) >= 100 ? '#2D6A4F' :
                       parseFloat(targetProgress) >= 70 ? '#FFB800' : '#E63946' }}>
                {parseFloat(targetProgress) >= 100 ? '🎉 Achieved!' :
                 parseFloat(targetProgress) >= 70 ? '⚡ On Track' : '⚠ Behind'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 4 }}>
            Revenue Forecast — Next 3 Months
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Solid line = actual · Dashed = forecast
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 10 }}
                     tickFormatter={(v) => v?.slice(5)}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v, n) => [`MK ${fmt(v)}`, n]}
                       labelFormatter={(l) => `Month: ${l}`}/>
              <Legend/>
              {forecast3.length > 0 && (
                <ReferenceLine x={forecast3[0]?.month}
                  stroke="#FFB800" strokeDasharray="4 4"
                  label={{ value: 'Forecast Start', fontSize: 10 }}/>
              )}
              <Line type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#FF6B35" strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return payload.forecast
                        ? <circle key={cx} cx={cx} cy={cy} r={4}
                            fill="none" stroke="#FF6B35"
                            strokeWidth={2} strokeDasharray="3"/>
                        : <circle key={cx} cx={cx} cy={cy} r={4}
                            fill="#FF6B35"/>;
                    }}/>
              <Line type="monotone" dataKey="profit" name="Profit"
                    stroke="#2D6A4F" strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return payload.forecast
                        ? <circle key={cx} cx={cx} cy={cy} r={3}
                            fill="none" stroke="#2D6A4F"
                            strokeWidth={2} strokeDasharray="3"/>
                        : <circle key={cx} cx={cx} cy={cy} r={3}
                            fill="#2D6A4F"/>;
                    }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 4 }}>
            6-Month Revenue Projection
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Extended forecast using linear regression
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={[...monthly.map(m => ({
                month: m.month?.slice(5),
                revenue: parseFloat(m.revenue || 0),
                type: 'actual'
              })),
              ...forecast6.map(f => ({
                month: f.month?.slice(5),
                projected: f.revenue,
                type: 'forecast'
              }))]}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v) => [`MK ${fmt(v)}`]}/>
              <Legend/>
              <Area type="monotone" dataKey="revenue" name="Actual Revenue"
                    stroke="#FF6B35" fill="url(#actGrad)" strokeWidth={2}/>
              <Area type="monotone" dataKey="projected" name="Projected Revenue"
                    stroke="#FFB800" fill="url(#projGrad)"
                    strokeWidth={2} strokeDasharray="5 5"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Demand + Growth Rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 16 }}>

        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 4 }}>
            Top Product Demand Forecast
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Products with highest unit sales — expect continued demand
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productDemand} layout="vertical"
              margin={{ top: 5, right: 20, left: 70, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis type="number" tick={{ fontSize: 10 }}/>
              <YAxis type="category" dataKey="product" tick={{ fontSize: 10 }}/>
              <Tooltip formatter={(v) => [`${v} units`, 'Units Sold']}/>
              <Bar dataKey="units" name="Units Sold" radius={[0,4,4,0]}>
                {productDemand.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', marginBottom: 4 }}>
            Month-over-Month Growth Rate
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Green = growth · Red = decline
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growthRates.slice(1)}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${v}%`}/>
              <Tooltip formatter={(v) => [`${v}%`, 'Growth Rate']}/>
              <ReferenceLine y={0} stroke="#888"/>
              <Bar dataKey="growth" name="Growth %" radius={[4,4,0,0]}>
                {growthRates.slice(1).map((entry, i) => (
                  <Cell key={i}
                    fill={entry.growth >= 0 ? '#2D6A4F' : '#E63946'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                      fontSize: 15, marginBottom: 16 }}>
          📊 6-Month Detailed Forecast
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#3E1F00' }}>
              {['Month','Projected Revenue','Projected Profit',
                'Margin','Confidence','vs Last Month'].map(h => (
                <th key={h} style={{ padding: '10px 14px', color: '#FFB800',
                  textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecast6.map((f, i) => {
              const prevRevenue = i === 0
                ? latestRevenue
                : forecast6[i-1].revenue;
              const change = prevRevenue > 0
                ? (((f.revenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
                : 0;
              const margin = f.revenue > 0
                ? ((f.profit / f.revenue) * 100).toFixed(1) : 0;
              const confidence = i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low';
              const confColor = i < 2 ? '#2E7D32' : i < 4 ? '#E65100' : '#C62828';
              const confBg = i < 2 ? '#E8F5E9' : i < 4 ? '#FFF3E0' : '#FFEBEE';
              return (
                <tr key={i} style={{
                  background: i % 2 === 0 ? '#FFF8F0' : 'white',
                  borderBottom: '1px solid #FFE8D0' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600',
                               color: '#3E1F00' }}>{f.month}</td>
                  <td style={{ padding: '10px 14px', color: '#2D6A4F',
                               fontWeight: '500' }}>MK {fmt(f.revenue)}</td>
                  <td style={{ padding: '10px 14px', color: '#FF6B35',
                               fontWeight: '500' }}>MK {fmt(f.profit)}</td>
                  <td style={{ padding: '10px 14px' }}>{margin}%</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: confBg, color: confColor,
                                   padding: '3px 10px', borderRadius: 10,
                                   fontSize: 11, fontWeight: 'bold' }}>
                      {confidence}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px',
                    color: parseFloat(change) >= 0 ? '#2E7D32' : '#C62828',
                    fontWeight: 'bold' }}>
                    {parseFloat(change) >= 0 ? '▲' : '▼'} {Math.abs(change)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}