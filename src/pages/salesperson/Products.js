import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Products({ token }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

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

  // Build product summary from sales
  const products = sales.reduce((acc, s) => {
    const found = acc.find(p => p.name === s.product);
    if (found) {
      found.totalRevenue += parseFloat(s.revenue || 0);
      found.totalProfit += parseFloat(s.profit || 0);
      found.totalUnits += parseInt(s.quantity || 0);
      found.transactions += 1;
      if (!found.regions.includes(s.region)) found.regions.push(s.region);
    } else {
      acc.push({
        name: s.product,
        category: s.category,
        unitPrice: parseFloat(s.unit_price || 0),
        unitCost: parseFloat(s.unit_cost || 0),
        totalRevenue: parseFloat(s.revenue || 0),
        totalProfit: parseFloat(s.profit || 0),
        totalUnits: parseInt(s.quantity || 0),
        transactions: 1,
        regions: [s.region],
        lastSale: s.sale_date,
      });
    }
    return acc;
  }, []).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = search === '' ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>Product Lookup</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Search products, check prices and sales performance
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: products.length, color: '#FF6B35' },
          { label: 'Categories', value: categories.length - 1, color: '#2D6A4F' },
          { label: 'Showing', value: filtered.length, color: '#FFB800' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 10,
            padding: '16px 20px', borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 22, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Product Cards */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input placeholder="Search product or category..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #FFB800', fontSize: 13, width: 240 }}/>
          <select value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #FFB800', fontSize: 13 }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={fetchSales}
            style={{ padding: '8px 16px', background: '#FF6B35',
                     border: 'none', borderRadius: 8, color: 'white',
                     cursor: 'pointer', fontSize: 13 }}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading products...
          </div>
        ) : (
          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map((p, i) => (
              <div key={i} style={{ border: '1px solid #FFE8D0', borderRadius: 10,
                                    padding: 16, background: '#FFFDF8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                              alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                fontSize: 14, flex: 1 }}>
                    {p.name}
                  </div>
                  <span style={{ background: '#FFF3E0', color: '#E65100',
                                 padding: '2px 8px', borderRadius: 10,
                                 fontSize: 11, whiteSpace: 'nowrap' }}>
                    {p.category}
                  </span>
                </div>
                <div style={{ display: 'grid',
                              gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#AAA' }}>Unit Price</div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2D6A4F' }}>
                      MK {fmt(p.unitPrice)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#AAA' }}>Unit Cost</div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#888' }}>
                      MK {fmt(p.unitCost)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#AAA' }}>Total Revenue</div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#FF6B35' }}>
                      MK {fmt(p.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#AAA' }}>Units Sold</div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#457B9D' }}>
                      {fmt(p.totalUnits)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10,
                              borderTop: '1px solid #FFE8D0',
                              display: 'flex', justifyContent: 'space-between',
                              fontSize: 11, color: '#888' }}>
                  <span>{p.transactions} transaction{p.transactions > 1 ? 's' : ''}</span>
                  <span>Last: {p.lastSale?.split('T')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}