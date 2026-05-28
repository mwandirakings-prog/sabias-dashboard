import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

export default function SalespersonDashboard({ token, user }) {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saleMode, setSaleMode] = useState('quick');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [cart, setCart] = useState([]);
  const [cartCustomer, setCartCustomer] = useState('');
  const [cartPayment, setCartPayment] = useState('Cash');
  const [cartRegion, setCartRegion] = useState(
    user?.region !== 'all' ? user?.region : ''
  );
  const [form, setForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    product: '', category: '',
    region: user?.region !== 'all' ? user?.region : '',
    customer: '', quantity: '', unit_price: '', unit_cost: '',
    salesperson: user?.name || '', payment: 'Cash'
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getStockStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'Out of Stock', color: '#C62828', bg: '#FFEBEE' };
    if (qty <= reorder) return { label: 'Low Stock', color: '#E65100', bg: '#FFF3E0' };
    return { label: 'In Stock', color: '#2E7D32', bg: '#E8F5E9' };
  };

  // ── CART FUNCTIONS ──────────────────────────────────────
  const addToCart = (product) => {
    if (product.quantity_in_stock === 0) {
      setErrorMsg(`${product.product} is out of stock!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) {
          setErrorMsg(`Only ${product.quantity_in_stock} units of ${product.product} available!`);
          setTimeout(() => setErrorMsg(''), 3000);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setErrorMsg('');
  };

  const updateCartQty = (id, qty, maxStock) => {
    const newQty = parseInt(qty);
    if (newQty < 1) return;
    if (newQty > maxStock) {
      setErrorMsg(`Only ${maxStock} units available!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) =>
    sum + (item.quantity * item.unit_price), 0);
  const cartProfit = cart.reduce((sum, item) =>
    sum + (item.quantity * (item.unit_price - item.unit_cost)), 0);

  const handleCartSubmit = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty! Add products first.');
      return;
    }
    if (!cartRegion) {
      setErrorMsg('Please enter a branch!');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      await Promise.all(cart.map(item =>
        axios.post(`${API}/api/sales`, {
          sale_date: saleDate,
          product: item.product,
          category: item.category,
          region: cartRegion,
          customer: cartCustomer,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          unit_cost: parseFloat(item.unit_cost),
          salesperson: user?.name,
          payment: cartPayment,
        }, h)
      ));
      setSuccessMsg(
        `${cart.length} item(s) sold! Total: MK ${fmt(cartTotal)} · ` +
        `Profit: MK ${fmt(cartProfit)}`
      );
      setCart([]);
      setCartCustomer('');
      setCartPayment('Cash');
      setShowForm(false);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg('Failed to record sales. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/sales`, {
        ...form,
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
        unit_cost: parseFloat(form.unit_cost),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('Sale submitted successfully!');
      setForm({
        sale_date: new Date().toISOString().split('T')[0],
        product: '', category: '',
        region: user?.region !== 'all' ? user?.region : '',
        customer: '', quantity: '', unit_price: '', unit_cost: '',
        salesperson: user?.name || '', payment: 'Cash'
      });
      setShowForm(false);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(p =>
    productSearch === '' ||
    p.product?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const mySales = sales.filter(s =>
    s.salesperson?.toLowerCase() === user?.name?.toLowerCase()
  );
  const todaySales = mySales.filter(s =>
    s.sale_date?.split('T')[0] === new Date().toISOString().split('T')[0]
  );
  const totalMyRevenue = mySales.reduce((sum, s) =>
    sum + parseFloat(s.revenue || 0), 0);
  const totalMyProfit = mySales.reduce((sum, s) =>
    sum + parseFloat(s.profit || 0), 0);
  const myMargin = totalMyRevenue > 0
    ? ((totalMyProfit / totalMyRevenue) * 100).toFixed(1) : 0;

  const filteredSales = mySales.filter(s =>
    search === '' ||
    s.product?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.toLowerCase().includes(search.toLowerCase())
  );

  const KPICard = ({ label, value, color, sub }) => (
    <div style={{ background: 'white', borderRadius: 12, padding: 20,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#3E1F00', fontSize: 20, fontWeight: 'bold' }}>{value}</div>
      {sub && <div style={{ color: '#AAA', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
            My Dashboard
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
            Welcome back,{' '}
            <strong style={{ color: '#FF6B35' }}>{user?.name}</strong>
            {' '}·{' '}{user?.company || 'Your Company'}
            {' '}·{' '}
            {user?.region !== 'all' ? user?.region : 'All Branches'}
          </p>
        </div>
        <button onClick={() => {
          setShowForm(!showForm);
          setCart([]);
          setErrorMsg('');
        }}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
                   padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 14 }}>
          {showForm ? 'Close' : '+ New Sale'}
          {cart.length > 0 && !showForm && (
            <span style={{ background: 'white', color: '#FF6B35',
                           borderRadius: '50%', padding: '1px 6px',
                           fontSize: 11, fontWeight: 'bold', marginLeft: 8 }}>
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#2E7D32', fontWeight: 'bold', fontSize: 13 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                      color: '#C62828', fontWeight: 'bold', fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        <KPICard label="My Total Revenue"
                 value={`MK ${fmt(totalMyRevenue)}`}
                 color="#FF6B35" sub="All time"/>
        <KPICard label="My Total Profit"
                 value={`MK ${fmt(totalMyProfit)}`}
                 color="#2D6A4F" sub="All time"/>
        <KPICard label="Today's Sales"
                 value={todaySales.length}
                 color="#FFB800"
                 sub={`MK ${fmt(todaySales.reduce((s, x) =>
                   s + parseFloat(x.revenue || 0), 0))}`}/>
        <KPICard label="Profit Margin"
                 value={`${myMargin}%`}
                 color="#457B9D"
                 sub={`${mySales.length} total transactions`}/>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>

          <div style={{ display: 'flex', gap: 0, marginBottom: 24,
                        border: '2px solid #FFB800', borderRadius: 10,
                        overflow: 'hidden', width: 'fit-content' }}>
            {[
              { id: 'quick', label: 'Cart Sell', desc: 'Add multiple products' },
              { id: 'manual', label: 'Manual Entry', desc: 'Fill form manually' },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => {
                  setSaleMode(tab.id);
                  setCart([]);
                  setErrorMsg('');
                }}
                style={{
                  padding: '12px 28px', border: 'none', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13,
                  background: saleMode === tab.id ? '#3E1F00' : 'white',
                  color: saleMode === tab.id ? '#FFB800' : '#888',
                }}>
                {tab.label}
                {tab.id === 'quick' && cart.length > 0 && (
                  <span style={{ background: '#FF6B35', color: 'white',
                                 borderRadius: '50%', padding: '1px 6px',
                                 fontSize: 10, marginLeft: 6 }}>
                    {cart.length}
                  </span>
                )}
                <div style={{ fontSize: 10, fontWeight: 'normal',
                              color: saleMode === tab.id ? '#FFB800' : '#AAA',
                              marginTop: 2 }}>
                  {tab.desc}
                </div>
              </button>
            ))}
          </div>

          {/* ── CART MODE ─────────────────────────────── */}
          {saleMode === 'quick' && (
            <div style={{ display: 'grid',
                          gridTemplateColumns: '1fr 380px', gap: 20 }}>

              {/* LEFT — Product Grid */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                  fontSize: 15 }}>
                      Click Products to Add to Cart
                    </div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                      Click multiple products — adjust quantities in cart
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#888' }}>Date:</span>
                    <input type="date" value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 6,
                               border: '1px solid #FFB800', fontSize: 12 }}/>
                  </div>
                </div>

                <input placeholder="Search product or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ padding: '8px 14px', borderRadius: 8,
                           border: '1.5px solid #FFB800', fontSize: 13,
                           width: '100%', marginBottom: 12,
                           boxSizing: 'border-box' }}/>

                <div style={{ display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: 10, maxHeight: 380, overflowY: 'auto' }}>
                  {filteredInventory.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center',
                                  padding: 40, color: '#888' }}>
                      No products found.
                    </div>
                  ) : filteredInventory.map((p, i) => {
                    const status = getStockStatus(
                      p.quantity_in_stock, p.reorder_level);
                    const inCart = cart.find(c => c.id === p.id);
                    const canSell = p.quantity_in_stock > 0;
                    return (
                      <div key={i} onClick={() => addToCart(p)}
                        style={{
                          border: inCart ? '2px solid #FF6B35'
                            : `1px solid ${canSell ? '#FFE8D0' : '#FFCDD2'}`,
                          borderRadius: 10, padding: 12,
                          background: inCart ? '#FFF3EE'
                            : canSell ? '#FFFDF8' : '#FFF5F5',
                          cursor: canSell ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s', position: 'relative',
                        }}>
                        {inCart && (
                          <div style={{ position: 'absolute', top: 6, right: 6,
                                        background: '#FF6B35', color: 'white',
                                        borderRadius: '50%', width: 20, height: 20,
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 11,
                                        fontWeight: 'bold' }}>
                            {inCart.quantity}
                          </div>
                        )}
                        <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                      fontSize: 12, marginBottom: 3,
                                      paddingRight: 20 }}>
                          {p.product}
                        </div>
                        <div style={{ fontSize: 10, color: '#888',
                                      marginBottom: 4 }}>
                          {p.category}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 'bold',
                                      color: '#2D6A4F' }}>
                          MK {fmt(p.unit_price)}
                        </div>
                        <div style={{ display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center', marginTop: 4 }}>
                          <span style={{ background: status.bg,
                                         color: status.color,
                                         padding: '1px 6px', borderRadius: 8,
                                         fontSize: 9, fontWeight: 'bold' }}>
                            {p.quantity_in_stock} left
                          </span>
                          {canSell && (
                            <span style={{ color: inCart ? '#FF6B35' : '#AAA',
                                           fontSize: 9, fontWeight: 'bold' }}>
                              {inCart ? 'In Cart' : '+ Add'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT — Cart */}
              <div style={{ background: '#FFF8F0', borderRadius: 12,
                            padding: 20, border: '2px solid #FF6B35',
                            display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#3E1F00', fontWeight: 'bold',
                              fontSize: 16, marginBottom: 4 }}>
                  🛒 Cart
                  {cart.length > 0 && (
                    <span style={{ background: '#FF6B35', color: 'white',
                                   fontSize: 12, padding: '2px 8px',
                                   borderRadius: 10, marginLeft: 8 }}>
                      {cart.length} item{cart.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexDirection: 'column',
                                color: '#AAA', padding: 20 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                    <div style={{ fontSize: 13 }}>Cart is empty</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      Click products to add them
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div style={{ flex: 1, overflowY: 'auto',
                                  maxHeight: 200, marginBottom: 12 }}>
                      {cart.map(item => (
                        <div key={item.id}
                          style={{ background: 'white', borderRadius: 8,
                                   padding: '10px 12px', marginBottom: 8,
                                   border: '1px solid #FFE8D0' }}>
                          <div style={{ display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 6 }}>
                            <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                          fontSize: 13, flex: 1 }}>
                              {item.product}
                            </div>
                            <button onClick={() => removeFromCart(item.id)}
                              style={{ background: '#FFEBEE', border: 'none',
                                       color: '#C62828', borderRadius: 4,
                                       padding: '2px 6px', cursor: 'pointer',
                                       fontSize: 11, marginLeft: 8 }}>
                              ✕
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex',
                                          alignItems: 'center', gap: 6 }}>
                              <button onClick={() => updateCartQty(
                                item.id, item.quantity - 1,
                                item.quantity_in_stock)}
                                style={{ background: '#FFE8D0', border: 'none',
                                         borderRadius: 4, width: 24, height: 24,
                                         cursor: 'pointer', fontWeight: 'bold',
                                         fontSize: 14, display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center' }}>
                                −
                              </button>
                              <input type="number" min="1"
                                max={item.quantity_in_stock}
                                value={item.quantity}
                                onChange={(e) => updateCartQty(
                                  item.id, e.target.value,
                                  item.quantity_in_stock)}
                                style={{ width: 48, padding: '3px 6px',
                                         borderRadius: 4,
                                         border: '1px solid #FFB800',
                                         fontSize: 13, textAlign: 'center',
                                         fontWeight: 'bold' }}/>
                              <button onClick={() => updateCartQty(
                                item.id, item.quantity + 1,
                                item.quantity_in_stock)}
                                style={{ background: '#FFE8D0', border: 'none',
                                         borderRadius: 4, width: 24, height: 24,
                                         cursor: 'pointer', fontWeight: 'bold',
                                         fontSize: 14, display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center' }}>
                                +
                              </button>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#2D6A4F', fontWeight: 'bold',
                                            fontSize: 13 }}>
                                MK {fmt(item.quantity * item.unit_price)}
                              </div>
                              <div style={{ color: '#888', fontSize: 10 }}>
                                MK {fmt(item.unit_price)} each
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Totals */}
                    <div style={{ background: 'white', borderRadius: 8,
                                  padding: 12, marginBottom: 12,
                                  border: '1px solid #FFE8D0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                                    marginBottom: 4 }}>
                        <span style={{ color: '#888', fontSize: 12 }}>
                          Total Revenue:
                        </span>
                        <span style={{ color: '#2D6A4F', fontWeight: 'bold',
                                       fontSize: 15 }}>
                          MK {fmt(cartTotal)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888', fontSize: 12 }}>
                          Total Profit:
                        </span>
                        <span style={{ color: '#FF6B35', fontWeight: 'bold',
                                       fontSize: 15 }}>
                          MK {fmt(cartProfit)}
                        </span>
                      </div>
                    </div>

                    {/* Cart Details */}
                    <div style={{ display: 'flex', flexDirection: 'column',
                                  gap: 8, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 4 }}>
                          Customer (optional)
                        </label>
                        <input type="text" value={cartCustomer}
                          placeholder="Walk-in customer"
                          onChange={(e) => setCartCustomer(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px',
                                   borderRadius: 6, border: '1px solid #FFB800',
                                   fontSize: 13, boxSizing: 'border-box' }}/>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 4 }}>
                          Branch *
                        </label>
                        <input type="text" value={cartRegion}
                          placeholder="e.g. Lilongwe"
                          onChange={(e) => setCartRegion(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px',
                                   borderRadius: 6, border: '1px solid #FFB800',
                                   fontSize: 13, boxSizing: 'border-box' }}/>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 4 }}>
                          Payment Method *
                        </label>
                        <select value={cartPayment}
                          onChange={(e) => setCartPayment(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px',
                                   borderRadius: 6, border: '1px solid #FFB800',
                                   fontSize: 13, boxSizing: 'border-box' }}>
                          <option>Cash</option>
                          <option>Mobile Money</option>
                          <option>Credit</option>
                          <option>Bank Transfer</option>
                          <option>Voucher</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Cart */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleCartSubmit}
                        disabled={submitting}
                        style={{ flex: 1, background: submitting
                                   ? '#AAA' : '#FF6B35',
                                 border: 'none', color: 'white',
                                 padding: '12px', borderRadius: 8,
                                 cursor: submitting ? 'not-allowed' : 'pointer',
                                 fontWeight: 'bold', fontSize: 14 }}>
                        {submitting
                          ? 'Recording...'
                          : `Record ${cart.length} Sale${cart.length > 1 ? 's' : ''}`}
                      </button>
                      <button onClick={() => setCart([])}
                        style={{ background: '#FFEBEE', border: 'none',
                                 color: '#C62828', padding: '12px 14px',
                                 borderRadius: 8, cursor: 'pointer',
                                 fontWeight: 'bold', fontSize: 13 }}>
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── MANUAL MODE ────────────────────────────── */}
          {saleMode === 'manual' && (
            <div>
              <div style={{ color: '#3E1F00', fontWeight: 'bold',
                            fontSize: 15, marginBottom: 16 }}>
                Manual Sale Entry
              </div>
              <form onSubmit={handleManualSubmit}>
                <div style={{ display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Sale Date', key: 'sale_date', type: 'date' },
                    { label: 'Product Name', key: 'product', type: 'text' },
                    { label: 'Category', key: 'category', type: 'text' },
                    { label: 'Branch/Region', key: 'region', type: 'text' },
                    { label: 'Customer (optional)', key: 'customer',
                      type: 'text', required: false },
                    { label: 'Quantity', key: 'quantity', type: 'number' },
                    { label: 'Unit Price (MWK)', key: 'unit_price',
                      type: 'number' },
                    { label: 'Unit Cost (MWK)', key: 'unit_cost',
                      type: 'number' },
                    { label: 'Salesperson', key: 'salesperson', type: 'text' },
                  ].map(({ label, key, type, required = true }) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, color: '#888',
                                      display: 'block', marginBottom: 4 }}>
                        {label}
                      </label>
                      <input type={type} required={required} value={form[key]}
                        onChange={(e) => setForm({
                          ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px',
                                 borderRadius: 6, border: '1px solid #FFB800',
                                 fontSize: 13, boxSizing: 'border-box' }}/>
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 11, color: '#888',
                                    display: 'block', marginBottom: 4 }}>
                      Payment Method
                    </label>
                    <select value={form.payment}
                      onChange={(e) => setForm({
                        ...form, payment: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px',
                               borderRadius: 6, border: '1px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}>
                      <option>Cash</option>
                      <option>Mobile Money</option>
                      <option>Credit</option>
                      <option>Bank Transfer</option>
                      <option>Voucher</option>
                    </select>
                  </div>
                </div>
                {form.quantity && form.unit_price && (
                  <div style={{ marginTop: 16, background: '#FFF8F0',
                                borderRadius: 8, padding: '12px 16px',
                                display: 'flex', gap: 24 }}>
                    <div>
                      <span style={{ color: '#888', fontSize: 12 }}>
                        Revenue:{' '}
                      </span>
                      <strong style={{ color: '#2D6A4F' }}>
                        MK {fmt(form.quantity * form.unit_price)}
                      </strong>
                    </div>
                    {form.unit_cost && (
                      <div>
                        <span style={{ color: '#888', fontSize: 12 }}>
                          Profit:{' '}
                        </span>
                        <strong style={{ color: '#FF6B35' }}>
                          MK {fmt(form.quantity *
                            (form.unit_price - form.unit_cost))}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting}
                    style={{ background: '#FF6B35', border: 'none',
                             color: 'white', padding: '10px 28px',
                             borderRadius: 6, cursor: 'pointer',
                             fontWeight: 'bold', fontSize: 14 }}>
                    {submitting ? 'Submitting...' : 'Submit Sale'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ background: '#3E1F00', border: 'none',
                             color: '#FFB800', padding: '10px 28px',
                             borderRadius: 6, cursor: 'pointer',
                             fontWeight: 'bold', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Recent Sales Table */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            My Recent Sales ({filteredSales.length})
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Search product or customer..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8,
                       border: '1px solid #FFB800', fontSize: 13, width: 220 }}/>
            <button onClick={fetchAll}
              style={{ padding: '8px 16px', background: '#FF6B35',
                       border: 'none', borderRadius: 8, color: 'white',
                       cursor: 'pointer', fontSize: 13 }}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading...
          </div>
        ) : filteredSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ color: '#888', fontSize: 14 }}>
              No sales yet. Click New Sale to get started!
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse',
                            fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#3E1F00' }}>
                  {['Date','Product','Category','Branch','Customer',
                    'Qty','Revenue','Profit','Payment'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
                      textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, 30).map((s, i) => (
                  <tr key={s.id} style={{
                    background: i % 2 === 0 ? '#FFF8F0' : 'white',
                    borderBottom: '1px solid #FFE8D0' }}>
                    <td style={{ padding: '8px 12px' }}>
                      {s.sale_date?.split('T')[0]}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500',
                                 color: '#3E1F00' }}>{s.product}</td>
                    <td style={{ padding: '8px 12px' }}>{s.category}</td>
                    <td style={{ padding: '8px 12px' }}>{s.region}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {s.customer || 'Walk-in'}
                    </td>
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
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: s.payment === 'Cash' ? '#E8F5E9' :
                                    s.payment === 'Mobile Money' ? '#E3F2FD' :
                                    s.payment === 'Voucher' ? '#F3E5F5' : '#FFF3E0',
                        color: s.payment === 'Cash' ? '#2E7D32' :
                               s.payment === 'Mobile Money' ? '#1565C0' :
                               s.payment === 'Voucher' ? '#6A1B9A' : '#E65100',
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
        )}
      </div>
    </div>
  );
}