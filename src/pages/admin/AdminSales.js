import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

export default function AdminSales({ token, user }) {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('sales'); // sales | cart | trash
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Cart state
  const [cart, setCart] = useState([]);
  const [cartBranch, setCartBranch] = useState('');
  const [cartPayment, setCartPayment] = useState('Cash');
  const [cartCustomer, setCartCustomer] = useState('');
  const [cartDate, setCartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cartSubmitting, setCartSubmitting] = useState(false);

  const [form, setForm] = useState({
    sale_date: '', product: '', category: '', region: '',
    customer: '', quantity: '', unit_price: '', unit_cost: '',
    salesperson: '', payment: 'Cash'
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchData = useCallback(async () => {
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [s, inv] = await Promise.all([
        axios.get(`${API}/api/sales`, h),
        axios.get(`${API}/api/inventory`, h),
      ]);
      setSales(s.data.data);
      setInventory(inv.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CART ──────────────────────────────────────────────────
  const addToCart = (product) => {
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.id === product.id
        ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(cart.map(c => c.id === id ? { ...c, qty } : c));
  };

  const cartTotal = cart.reduce((sum, c) =>
    sum + (parseFloat(c.unit_price) * c.qty), 0);

  const cartProfit = cart.reduce((sum, c) =>
    sum + ((parseFloat(c.unit_price) - parseFloat(c.unit_cost || 0)) * c.qty), 0);

  const handleCartCheckout = async () => {
    if (cart.length === 0) return;
    if (!cartBranch) { setErrorMsg('Please select a branch.'); return; }
    setCartSubmitting(true);
    setErrorMsg('');
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      for (const item of cart) {
        await axios.post(`${API}/api/sales`, {
          sale_date: cartDate,
          product: item.product,
          category: item.category,
          region: cartBranch,
          customer: cartCustomer || 'Walk-in',
          quantity: item.qty,
          unit_price: parseFloat(item.unit_price),
          unit_cost: parseFloat(item.unit_cost || 0),
          salesperson: user?.name || 'Admin',
          payment: cartPayment,
        }, h);
      }
      setSuccessMsg(`Cart of ${cart.length} product(s) sold successfully!`);
      setCart([]);
      setCartCustomer('');
      setView('sales');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Sale failed. Try again.');
    } finally {
      setCartSubmitting(false);
    }
  };

  // ── MANUAL FORM SUBMIT ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await axios.post(`${API}/api/sales`, {
        ...form,
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
        unit_cost: parseFloat(form.unit_cost),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('Sale recorded successfully!');
      setForm({ sale_date: '', product: '', category: '', region: '',
        customer: '', quantity: '', unit_price: '', unit_cost: '',
        salesperson: '', payment: 'Cash' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record sale.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── SOFT DELETE ───────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Move this sale to trash?')) return;
    try {
      await axios.delete(`${API}/api/sales/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('Sale moved to trash.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to delete sale.');
    }
  };

  const uniqueCategories = ['All', ...new Set(sales.map(s => s.category).filter(Boolean))];
  const uniquePayments = ['All', 'Cash', 'Mobile Money', 'Credit', 'Bank Transfer', 'Voucher'];

  const activeSales = sales.filter(s => !s.deleted_at);
  const trashedSales = sales.filter(s => s.deleted_at);

  const filtered = activeSales.filter(s => {
    const matchSearch = search === '' ||
      s.product?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase()) ||
      s.salesperson?.toLowerCase().includes(search.toLowerCase());
    const matchPayment = filterPayment === 'All' || s.payment === filterPayment;
    const matchCategory = filterCategory === 'All' || s.category === filterCategory;
    return matchSearch && matchPayment && matchCategory;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
  const totalProfit = filtered.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);

  const payBadge = (payment) => {
    const map = {
      'Cash': { bg: '#E8F5E9', color: '#2E7D32' },
      'Mobile Money': { bg: '#E3F2FD', color: '#1565C0' },
      'Voucher': { bg: '#F3E5F5', color: '#6A1B9A' },
    };
    return map[payment] || { bg: '#FFF3E0', color: '#E65100' };
  };

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 16,
                    flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
            Sales Management
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            View, record and manage sales transactions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'sales', label: 'Sales List' },
            { key: 'cart', label: `Cart${cart.length > 0 ? ` (${cart.length})` : ''}` },
            { key: 'trash', label: `Trash (${trashedSales.length})` },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 'bold', fontSize: 13,
                background: view === v.key ? '#3E1F00' : '#FFF8F0',
                color: view === v.key ? '#FFB800' : '#888',
                border: view === v.key ? 'none' : '1px solid #FFE8D0' }}>
              {v.label}
            </button>
          ))}
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#FF6B35', border: 'none', color: 'white',
                     padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                     fontWeight: 'bold', fontSize: 13 }}>
            + Quick Sale
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '10px 16px', marginBottom: 16,
                      color: '#2E7D32', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2',
                      borderRadius: 8, padding: '10px 16px', marginBottom: 16,
                      color: '#C62828', fontWeight: 'bold' }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Quick Sale Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h3 style={{ color: '#3E1F00', marginTop: 0, fontSize: 16 }}>
            Quick Sale
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10 }}>
              {[
                { label: 'Sale Date', key: 'sale_date', type: 'date' },
                { label: 'Product', key: 'product', type: 'text' },
                { label: 'Category', key: 'category', type: 'text' },
                { label: 'Branch', key: 'region', type: 'text' },
                { label: 'Customer', key: 'customer', type: 'text' },
                { label: 'Quantity', key: 'quantity', type: 'number' },
                { label: 'Unit Price', key: 'unit_price', type: 'number' },
                { label: 'Unit Cost', key: 'unit_cost', type: 'number' },
                { label: 'Salesperson', key: 'salesperson', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>
                    {label}
                  </label>
                  <input type={type} required={key !== 'customer'} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                      border: '1px solid #FFB800', fontSize: 13, boxSizing: 'border-box' }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>
                  Payment
                </label>
                <select value={form.payment}
                  onChange={(e) => setForm({ ...form, payment: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: '1px solid #FFB800', fontSize: 13, boxSizing: 'border-box' }}>
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Credit</option>
                  <option>Bank Transfer</option>
                  <option>Voucher</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button type="submit" disabled={submitting}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                  padding: '9px 20px', borderRadius: 6, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13 }}>
                {submitting ? 'Saving...' : 'Save Sale'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                  padding: '9px 20px', borderRadius: 6, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CART VIEW ──────────────────────────────────────── */}
      {view === 'cart' && (
        <div>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16 }}>

            {/* Products */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ color: '#3E1F00', fontWeight: 'bold',
                            marginBottom: 12, fontSize: 15 }}>
                Products — Click to Add
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                            maxHeight: 400, overflowY: 'auto' }}>
                {inventory.filter(i => i.quantity_in_stock > 0).map(product => (
                  <div key={product.id}
                    onClick={() => addToCart(product)}
                    style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '10px 12px',
                      background: '#FFF8F0', borderRadius: 8, cursor: 'pointer',
                      border: '1px solid #FFE8D0',
                      transition: 'all 0.15s' }}>
                    <div>
                      <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                    fontSize: 13 }}>
                        {product.product}
                      </div>
                      <div style={{ color: '#888', fontSize: 11 }}>
                        {product.category} · Stock: {product.quantity_in_stock}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#FF6B35', fontWeight: 'bold',
                                    fontSize: 13 }}>
                        MK {fmt(product.unit_price)}
                      </div>
                      <div style={{ color: '#2D6A4F', fontSize: 11 }}>
                        + Add
                      </div>
                    </div>
                  </div>
                ))}
                {inventory.filter(i => i.quantity_in_stock > 0).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#888',
                                padding: 20, fontSize: 13 }}>
                    No products in stock. Add inventory first.
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ color: '#3E1F00', fontWeight: 'bold',
                            marginBottom: 12, fontSize: 15 }}>
                Cart ({cart.length} items)
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                  Click products on the left to add them
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column',
                                gap: 8, marginBottom: 16, maxHeight: 240,
                                overflowY: 'auto' }}>
                    {cart.map(item => (
                      <div key={item.id}
                        style={{ display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', padding: '8px 10px',
                          background: '#FFF8F0', borderRadius: 8,
                          border: '1px solid #FFE8D0' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                        fontSize: 12 }}>
                            {item.product}
                          </div>
                          <div style={{ color: '#888', fontSize: 11 }}>
                            MK {fmt(item.unit_price)} each
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center',
                                      gap: 6 }}>
                          <button onClick={() => updateQty(item.id, item.qty - 1)}
                            style={{ width: 24, height: 24, borderRadius: '50%',
                              border: 'none', background: '#FFE8D0',
                              cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                            -
                          </button>
                          <span style={{ fontWeight: 'bold', fontSize: 14,
                                         minWidth: 20, textAlign: 'center' }}>
                            {item.qty}
                          </span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)}
                            style={{ width: 24, height: 24, borderRadius: '50%',
                              border: 'none', background: '#FF6B35', color: 'white',
                              cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                            +
                          </button>
                          <button onClick={() => removeFromCart(item.id)}
                            style={{ width: 24, height: 24, borderRadius: '50%',
                              border: 'none', background: '#FFEBEE', color: '#C62828',
                              cursor: 'pointer', fontSize: 12 }}>
                            ×
                          </button>
                        </div>
                        <div style={{ color: '#2D6A4F', fontWeight: 'bold',
                                      fontSize: 13, marginLeft: 8, minWidth: 70,
                                      textAlign: 'right' }}>
                          MK {fmt(parseFloat(item.unit_price) * item.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Details */}
                  <div style={{ display: 'grid',
                    gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#888',
                                      display: 'block', marginBottom: 4 }}>
                        Sale Date
                      </label>
                      <input type="date" value={cartDate}
                        onChange={(e) => setCartDate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: '1px solid #FFB800', fontSize: 13,
                          boxSizing: 'border-box' }}/>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#888',
                                      display: 'block', marginBottom: 4 }}>
                        Branch *
                      </label>
                      <input type="text" placeholder="e.g. Lilongwe" value={cartBranch}
                        onChange={(e) => setCartBranch(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: '1px solid #FFB800', fontSize: 13,
                          boxSizing: 'border-box' }}/>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#888',
                                      display: 'block', marginBottom: 4 }}>
                        Customer
                      </label>
                      <input type="text" placeholder="Walk-in" value={cartCustomer}
                        onChange={(e) => setCartCustomer(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: '1px solid #FFB800', fontSize: 13,
                          boxSizing: 'border-box' }}/>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#888',
                                      display: 'block', marginBottom: 4 }}>
                        Payment
                      </label>
                      <select value={cartPayment}
                        onChange={(e) => setCartPayment(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: '1px solid #FFB800', fontSize: 13,
                          boxSizing: 'border-box' }}>
                        <option>Cash</option>
                        <option>Mobile Money</option>
                        <option>Credit</option>
                        <option>Bank Transfer</option>
                        <option>Voucher</option>
                      </select>
                    </div>
                  </div>

                  {/* Totals */}
                  <div style={{ background: '#3E1F00', borderRadius: 10,
                                padding: '12px 16px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  marginBottom: 4 }}>
                      <span style={{ color: '#FFE8D0', fontSize: 13 }}>
                        Total Revenue
                      </span>
                      <span style={{ color: '#FFB800', fontWeight: 'bold',
                                     fontSize: 16 }}>
                        MK {fmt(cartTotal)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#FFE8D0', fontSize: 13 }}>
                        Est. Profit
                      </span>
                      <span style={{ color: '#52B788', fontWeight: 'bold',
                                     fontSize: 14 }}>
                        MK {fmt(cartProfit)}
                      </span>
                    </div>
                  </div>

                  <button onClick={handleCartCheckout} disabled={cartSubmitting}
                    style={{ width: '100%', background: cartSubmitting
                      ? '#ccc' : '#FF6B35', border: 'none', color: 'white',
                      padding: '12px', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 'bold', fontSize: 14, fontFamily: 'Arial' }}>
                    {cartSubmitting
                      ? 'Processing...'
                      : `Complete Sale — MK ${fmt(cartTotal)}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SALES LIST VIEW ────────────────────────────────── */}
      {view === 'sales' && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Transactions', value: filtered.length, color: '#FF6B35' },
              { label: 'Revenue', value: `MK ${fmt(totalRevenue)}`, color: '#2D6A4F' },
              { label: 'Profit', value: `MK ${fmt(totalProfit)}`, color: '#FFB800' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', borderRadius: 12,
                padding: 14, borderLeft: `4px solid ${color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{label}</div>
                <div style={{ color: '#3E1F00', fontSize: 16, fontWeight: 'bold' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8,
                          marginBottom: 14, alignItems: 'center' }}>
              <input placeholder="Search product, customer, salesperson..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, flex: 1,
                  border: '1px solid #FFB800', fontSize: 13, minWidth: 160 }}/>
              <select value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #FFB800', fontSize: 13 }}>
                {uniqueCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #FFB800', fontSize: 13 }}>
                {uniquePayments.map(p => <option key={p}>{p}</option>)}
              </select>
              <button onClick={fetchData}
                style={{ padding: '8px 14px', background: '#FF6B35', border: 'none',
                  borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13 }}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                Loading...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse',
                                fontSize: 12, minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#3E1F00' }}>
                      {['Date','Product','Branch','Customer','Qty',
                        'Revenue','Profit','Payment','Action'].map(h => (
                        <th key={h} style={{ padding: '10px 10px', color: '#FFB800',
                          textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((s, i) => {
                      const pb = payBadge(s.payment);
                      return (
                        <tr key={s.id} style={{ background: i % 2 === 0 ? '#FFF8F0' : 'white',
                          borderBottom: '1px solid #FFE8D0' }}>
                          <td style={{ padding: '8px 10px' }}>
                            {s.sale_date?.split('T')[0]}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: '500',
                                       color: '#3E1F00' }}>{s.product}</td>
                          <td style={{ padding: '8px 10px' }}>{s.region}</td>
                          <td style={{ padding: '8px 10px' }}>
                            {s.customer || 'Walk-in'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {s.quantity}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right',
                                       color: '#2D6A4F', fontWeight: '500' }}>
                            MK {fmt(s.revenue)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right',
                                       color: '#FF6B35', fontWeight: '500' }}>
                            MK {fmt(s.profit)}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ background: pb.bg, color: pb.color,
                              padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                              {s.payment}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <button onClick={() => handleDelete(s.id)}
                              style={{ background: '#FFEBEE', border: 'none',
                                color: '#C62828', padding: '3px 8px',
                                borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TRASH VIEW ─────────────────────────────────────── */}
      {view === 'trash' && (
        <div style={{ background: 'white', borderRadius: 12, padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        fontSize: 15, marginBottom: 4 }}>
            Deleted Sales ({trashedSales.length})
          </div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
            These sales have been soft deleted. Contact your administrator
            to restore or permanently delete them.
          </div>
          {trashedSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗑</div>
              No deleted sales
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse',
                              fontSize: 12, minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#4A0404' }}>
                    {['Date','Product','Branch','Qty','Revenue','Deleted'].map(h => (
                      <th key={h} style={{ padding: '10px 10px', color: '#FF6B6B',
                        textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trashedSales.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#FFF5F5' : 'white',
                      borderBottom: '1px solid #FFCDD2', opacity: 0.7 }}>
                      <td style={{ padding: '8px 10px' }}>
                        {s.sale_date?.split('T')[0]}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#888',
                                   textDecoration: 'line-through' }}>
                        {s.product}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#888' }}>
                        {s.region}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{s.quantity}</td>
                      <td style={{ padding: '8px 10px', color: '#888' }}>
                        MK {fmt(s.revenue)}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#C62828',
                                   fontSize: 11 }}>
                        {s.deleted_at?.split('T')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
