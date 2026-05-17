import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Inventory({ token, user }) {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    product: '', category: '', unit_price: '', unit_cost: '',
    quantity_in_stock: '', reorder_level: '', supplier: ''
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const cid = user?.company_id;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        ...form,
        unit_price: parseFloat(form.unit_price),
        unit_cost: parseFloat(form.unit_cost),
        quantity_in_stock: parseInt(form.quantity_in_stock),
        reorder_level: parseInt(form.reorder_level),
        company_id: user?.company_id,
      };
      if (editItem) {
        await axios.put(`${API}/api/inventory/${editItem.id}`, payload, h);
        setSuccessMsg('Product updated successfully!');
      } else {
        await axios.post(`${API}/api/inventory`, payload, h);
        setSuccessMsg('Product added successfully!');
      }
      setForm({ product: '', category: '', unit_price: '', unit_cost: '',
                quantity_in_stock: '', reorder_level: '', supplier: '' });
      setShowForm(false);
      setEditItem(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      product: item.product,
      category: item.category,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      quantity_in_stock: item.quantity_in_stock,
      reorder_level: item.reorder_level,
      supplier: item.supplier,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/api/inventory/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

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
      Loading Inventory...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
            Inventory Management
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Track stock levels for{' '}
            <strong style={{ color: '#FF6B35' }}>
              {user?.company || 'Your Company'}
            </strong>
          </p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditItem(null);
          setForm({ product: '', category: '', unit_price: '', unit_cost: '',
                    quantity_in_stock: '', reorder_level: '', supplier: '' }); }}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
                   padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 14 }}>
          + Add Product
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 16 }}>
        <KPICard label="Total Products"
                 value={fmt(summary?.total_products)}
                 color="#FF6B35" sub="Distinct products"/>
        <KPICard label="Total Units in Stock"
                 value={fmt(summary?.total_units)}
                 color="#2D6A4F" sub="All products combined"/>
        <KPICard label="Retail Value"
                 value={`MK ${fmt(summary?.total_retail_value)}`}
                 color="#FFB800" sub="At selling price"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        <KPICard label="Cost Value"
                 value={`MK ${fmt(summary?.total_cost_value)}`}
                 color="#457B9D" sub="At purchase price"/>
        <KPICard label="Low Stock Items"
                 value={fmt(summary?.low_stock)}
                 color="#E63946" sub="Need reordering"/>
        <KPICard label="Out of Stock"
                 value={fmt(summary?.out_of_stock)}
                 color="#9B5DE5" sub="Zero inventory"/>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <h3 style={{ color: '#3E1F00', marginTop: 0 }}>
            {editItem ? 'Update Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Product Name', key: 'product', type: 'text' },
                { label: 'Category', key: 'category', type: 'text' },
                { label: 'Unit Price (MWK)', key: 'unit_price', type: 'number' },
                { label: 'Unit Cost (MWK)', key: 'unit_cost', type: 'number' },
                { label: 'Quantity in Stock', key: 'quantity_in_stock', type: 'number' },
                { label: 'Reorder Level', key: 'reorder_level', type: 'number' },
                { label: 'Supplier', key: 'supplier', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                                  display: 'block', marginBottom: 6 }}>
                    {label} <span style={{ color: '#FF6B35' }}>*</span>
                  </label>
                  <input type={type} required value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                             border: '1.5px solid #FFB800', fontSize: 13,
                             boxSizing: 'border-box', background: '#FFFDF8' }}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                         padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                         fontWeight: 'bold', fontSize: 14 }}>
                {submitting ? 'Saving...' : editItem ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditItem(null); }}
                style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                         padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                         fontWeight: 'bold', fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16,
                      flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            Stock List ({filtered.length} products)
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Search product or supplier..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13, width: 220 }}/>
            <select value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13 }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={fetchData}
              style={{ padding: '8px 16px', background: '#FF6B35', border: 'none',
                       borderRadius: 8, color: 'white', cursor: 'pointer',
                       fontSize: 13 }}>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#3E1F00' }}>
                {['Product','Category','Supplier','Unit Price','Unit Cost',
                  'In Stock','Reorder Level','Stock Value','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
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
                    background: i % 2 === 0 ? '#FFF8F0' : 'white',
                    borderBottom: '1px solid #FFE8D0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600',
                                 color: '#3E1F00' }}>{item.product}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#FFF3E0', color: '#E65100',
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
                                 color: '#888' }}>
                      MK {fmt(item.unit_cost)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right',
                                 fontWeight: 'bold', fontSize: 14,
                                 color: status.color }}>
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
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(item)}
                          style={{ background: '#FFB800', border: 'none',
                                   color: '#3E1F00', padding: '4px 10px',
                                   borderRadius: 6, cursor: 'pointer',
                                   fontSize: 11, fontWeight: 'bold' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          style={{ background: '#FFEBEE', border: 'none',
                                   color: '#C62828', padding: '4px 10px',
                                   borderRadius: 6, cursor: 'pointer',
                                   fontSize: 11, fontWeight: 'bold' }}>
                          Delete
                        </button>
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