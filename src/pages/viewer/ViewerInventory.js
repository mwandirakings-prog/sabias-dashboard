import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function ViewerInventory({ token, user }) {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cid = user?.company_id;
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [inv, sum] = await Promise.all([
        axios.get(`${API}/api/inventory?company_id=${cid}`, h),
        axios.get(`${API}/api/inventory/summary?company_id=${cid}`, h),
      ]);
      setInventory(inv.data.data);
      setSummary(sum.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStockStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'Out of Stock', color: '#C62828', bg: '#FFEBEE' };
    if (qty <= reorder) return { label: 'Low Stock', color: '#E65100', bg: '#FFF3E0' };
    return { label: 'In Stock', color: '#2E7D32', bg: '#E8F5E9' };
  };

  const categories = ['All', ...new Set(inventory.map(i => i.category).filter(Boolean))];

  const filtered = inventory.filter(i => {
    const matchSearch = search === '' ||
      i.product?.toLowerCase().includes(search.toLowerCase()) ||
      i.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#2C3E50', fontSize: 18 }}>
      Loading Inventory...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#2C3E50', margin: 0, fontSize: 22 }}>
          Inventory View
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Stock levels for{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong>
          {' '}— read only
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Total Products',
            value: fmt(summary?.total_products), color: '#2980B9' },
          { label: 'Total Units',
            value: fmt(summary?.total_units), color: '#2D6A4F' },
          { label: 'Retail Value',
            value: `MK ${fmt(summary?.total_retail_value)}`, color: '#FFB800' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#2C3E50', fontSize: 20,
                          fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Cost Value',
            value: `MK ${fmt(summary?.total_cost_value)}`, color: '#457B9D' },
          { label: 'Low Stock Items',
            value: fmt(summary?.low_stock), color: '#E63946' },
          { label: 'Out of Stock',
            value: fmt(summary?.out_of_stock), color: '#9B5DE5' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#2C3E50', fontSize: 20,
                          fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16,
                      flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#2C3E50', fontWeight: 'bold', fontSize: 15 }}>
            Stock List ({filtered.length} products)
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Search product or supplier..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #2980B9', fontSize: 13, width: 220 }}/>
            <select value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #2980B9', fontSize: 13 }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={fetchData}
              style={{ padding: '8px 16px', background: '#2980B9',
                       border: 'none', borderRadius: 8, color: 'white',
                       cursor: 'pointer', fontSize: 13 }}>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#2C3E50' }}>
                {['Product','Category','Supplier','Unit Price',
                  'In Stock','Reorder Level','Stock Value','Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#4CC9F0',
                    textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const status = getStockStatus(
                  item.quantity_in_stock, item.reorder_level);
                return (
                  <tr key={item.id} style={{
                    background: i % 2 === 0 ? '#EBF5FB' : 'white',
                    borderBottom: '1px solid #D6EAF8' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600',
                                 color: '#2C3E50' }}>{item.product}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#D6EAF8', color: '#1565C0',
                                     padding: '2px 8px', borderRadius: 10,
                                     fontSize: 11 }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>
                      {item.supplier}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right',
                                 color: '#2D6A4F', fontWeight: '500' }}>
                      MK {fmt(item.unit_price)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right',
                                 fontWeight: 'bold', color: status.color }}>
                      {fmt(item.quantity_in_stock)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right',
                                 color: '#888' }}>
                      {fmt(item.reorder_level)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right',
                                 color: '#457B9D', fontWeight: '500' }}>
                      MK {fmt(item.quantity_in_stock * item.unit_price)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: status.bg, color: status.color,
                                     padding: '3px 10px', borderRadius: 10,
                                     fontSize: 11, fontWeight: 'bold' }}>
                        {status.label}
                      </span>
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