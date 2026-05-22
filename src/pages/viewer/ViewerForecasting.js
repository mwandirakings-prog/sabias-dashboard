import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell
} from 'recharts';

const API = 'https://malawi-sales-backend.onrender.com';

export default function ViewerForecasting({ token, user }) {
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API}/api/monthly`, h);
      setMonthly(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
        projected: Math.round(predicted),
        profit: Math.round(predicted * 0.17),
      });
    }
    return forecasts;
  };

  const forecast3 = generateForecast(monthly, 3);
  const forecast6 = generateForecast(monthly, 6);

  const chartData = [
    ...monthly.map(m => ({
      month: m.month?.slice(5),
      revenue: parseFloat(m.revenue || 0),
      profit: parseFloat(m.profit || 0),
    })),
    ...forecast3.map(f => ({
      month: f.month?.slice(5),
      projected: f.projected,
    })),
  ];

  const growthRates = monthly.map((m, i) => {
    if (i === 0) return { month: m.month?.slice(5), growth: 0 };
    const prev = parseFloat(monthly[i-1].revenue || 0);
    const curr = parseFloat(m.revenue || 0);
    return {
      month: m.month?.slice(5),
      growth: prev > 0
        ? parseFloat(((curr - prev) / prev * 100).toFixed(1)) : 0
    };
  });

  const latestRevenue = parseFloat(monthly[monthly.length - 1]?.revenue || 0);
  const nextMonthForecast = forecast3[0]?.projected || 0;
  const avgGrowth = growthRates.length > 1
    ? (growthRates.slice(1).reduce((s, g) => s + g.growth, 0) /
       (growthRates.length - 1)).toFixed(1) : 0;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#2C3E50', fontSize: 18 }}>
      Loading Forecasting...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#2C3E50', margin: 0, fontSize: 22 }}>
          Forecasting & Analytics
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Sales trends and projections for{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong>
        </p>
      </div>

      <div style={{ background: '#EBF5FB', borderRadius: 10, padding: 12,
                    border: '1px solid #D6EAF8', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <span style={{ color: '#1565C0', fontSize: 13 }}>
          Read-only view. Contact Admin to set revenue targets.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Latest Month Revenue', value: `MK ${fmt(latestRevenue)}`,
            color: '#2980B9', sub: 'Most recent actual' },
          { label: 'Next Month Forecast', value: `MK ${fmt(nextMonthForecast)}`,
            color: '#2D6A4F', sub: 'Predicted revenue' },
          { label: 'Avg Monthly Growth', value: `${avgGrowth}%`,
            color: '#FFB800', sub: 'Historical average' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#2C3E50', fontSize: 18,
                          fontWeight: 'bold' }}>{value}</div>
            <div style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#2C3E50', fontWeight: 'bold', marginBottom: 4 }}>
            Revenue Trend & Forecast
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Actual revenue with 3-month projection
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2980B9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2980B9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="projGrad2" x1="0" y1="0" x2="0" y2="1">
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
                    stroke="#2980B9" fill="url(#revGrad2)" strokeWidth={2}/>
              <Area type="monotone" dataKey="projected" name="Projected Revenue"
                    stroke="#FFB800" fill="url(#projGrad2)"
                    strokeWidth={2} strokeDasharray="5 5"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#2C3E50', fontWeight: 'bold', marginBottom: 4 }}>
            Monthly Growth Rate
          </div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>
            Month over month % change
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growthRates.slice(1)}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="month" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}
                     tickFormatter={(v) => `${v}%`}/>
              <Tooltip formatter={(v) => [`${v}%`, 'Growth Rate']}/>
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

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ color: '#2C3E50', fontWeight: 'bold',
                      fontSize: 15, marginBottom: 16 }}>
          6-Month Revenue Forecast
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse',
                        fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#2C3E50' }}>
              {['Month','Projected Revenue','Projected Profit',
                'Margin','Confidence','vs Last Month'].map(h => (
                <th key={h} style={{ padding: '10px 14px', color: '#4CC9F0',
                  textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecast6.map((f, i) => {
              const prevRevenue = i === 0
                ? latestRevenue : forecast6[i-1].projected;
              const change = prevRevenue > 0
                ? (((f.projected - prevRevenue) / prevRevenue) * 100).toFixed(1)
                : 0;
              const margin = f.projected > 0
                ? ((f.profit / f.projected) * 100).toFixed(1) : 0;
              const confidence = i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low';
              const confColor = i < 2 ? '#2E7D32'
                : i < 4 ? '#E65100' : '#C62828';
              const confBg = i < 2 ? '#E8F5E9'
                : i < 4 ? '#FFF3E0' : '#FFEBEE';
              return (
                <tr key={i} style={{
                  background: i % 2 === 0 ? '#EBF5FB' : 'white',
                  borderBottom: '1px solid #D6EAF8' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600',
                               color: '#2C3E50' }}>{f.month}</td>
                  <td style={{ padding: '10px 14px', color: '#2D6A4F',
                               fontWeight: '500' }}>MK {fmt(f.projected)}</td>
                  <td style={{ padding: '10px 14px', color: '#2980B9',
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