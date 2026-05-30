import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

export default function SalespersonCart({ token, user }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mySales, setMySales] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pressedProduct, setPressedProduct] = useState(null);
  const [pressedTab, setPressedTab] = useState(null);
  const [customer, setCustomer] = useState('');
  const [payment, setPayment] = useState('Cash');

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data.filter(p => p.quantity_in_stock > 0));
    } catch (err) {
      setErrorMsg('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await axios.get(`${API}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mine = res.data.data.filter(
        s => s.salesperson?.toLowerCase() === user?.name?.toLowerCase()
      );
      setMySales(mine.slice(0, 30));
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  }, [token, user]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const ms = p.product?.toLowerCase().includes(search.toLowerCase());
    const mc = categoryFilter === 'All' || p.category === categoryFilter;
    return ms && mc;
  });

  const addToCart = (product) => {
    setPressedProduct(product.id);
    setTimeout(() => setPressedProduct(null), 200);
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        if (ex.qty >= product.quantity_in_stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nq = i.qty + delta;
      if (nq <= 0) return null;
      if (nq > i.quantity_in_stock) return i;
      return { ...i, qty: nq };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const cartProfit = cart.reduce((s, i) => s + i.qty * (i.unit_price - (i.unit_cost || 0)), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { setErrorMsg('Cart is empty.'); return; }
    setCheckoutLoading(true);
    setErrorMsg('');
    const today = new Date().toISOString().split('T')[0];
    try {
      for (const item of cart) {
        await axios.post(`${API}/api/sales`, {
          sale_date: today,
          product: item.product,
          category: item.category,
          region: user?.region || 'Main Branch',
          customer: customer || 'Walk-in Customer',
          quantity: item.qty,
          unit_price: item.unit_price,
          unit_cost: item.unit_cost || 0,
          salesperson: user?.name,
          payment,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      const count = cart.length;
      const total = cartTotal;
      setCart([]); setCustomer(''); setPayment('Cash');
      setSuccessMsg(`Sale complete! ${count} product(s) · MK ${fmt(total)}`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchProducts();
      setActiveTab('history');
      fetchHistory();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally { setCheckoutLoading(false); }
  };

  const handleTabPress = (tab) => {
    setPressedTab(tab);
    setTimeout(() => setPressedTab(null), 200);
    setActiveTab(tab);
  };

  const tabStyle = (tab) => ({
    flex: 1, padding: '11px 8px', border: 'none', cursor: 'pointer',
    fontWeight: 'bold', fontSize: 13, borderRadius: 8,
    transition: 'all 0.15s ease',
    transform: pressedTab === tab ? 'scale(0.93)' : 'scale(1)',
    background: activeTab === tab ? '#3E1F00' : '#FFF3E8',
    color: activeTab === tab ? '#FFB800' : '#888',
    boxShadow: activeTab === tab ? '0 2px 8px rgba(62,31,0,0.2)' : 'none',
    fontFamily: 'Arial',
  });

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>Cart Selling</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Tap products to add to cart · Checkout everything in one go
        </p>
      </div>

      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          color: '#2E7D32', fontWeight: 'bold' }}>✓ {successMsg}</div>
      )}
      {errorMsg && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          color: '#C62828', fontSize: 13 }}>
          {errorMsg}
          <button onClick={() => setErrorMsg('')}
            style={{ marginLeft: 12, background: 'none', border: 'none',
              cursor: 'pointer', color: '#C62828', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* Cart summary bar */}
      {cart.length > 0 && (
        <div onClick={() => handleTabPress('cart')}
          style={{ background: '#3E1F00', borderRadius: 12, padding: '12px 20px',
            marginBottom: 16, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s',
            transform: pressedTab === 'cart' ? 'scale(0.98)' : 'scale(1)' }}>
          <div style={{ color: '#FFB800', fontWeight: 'bold', fontSize: 14 }}>
            {cart.length} item{cart.length !== 1 ? 's' : ''} in cart · {cart.reduce((s,i)=>s+i.qty,0)} units
          </div>
          <div style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 16 }}>
            MK {fmt(cartTotal)} →
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20,
        background: '#FFF3E8', padding: 6, borderRadius: 12 }}>
        <button style={tabStyle('products')} onClick={() => handleTabPress('products')}>
          Products
        </button>
        <button style={tabStyle('cart')} onClick={() => handleTabPress('cart')}>
          Cart{cart.length > 0 && (
            <span style={{ background: '#FF6B35', color: 'white',
              borderRadius: '50%', padding: '1px 6px', fontSize: 10,
              marginLeft: 6 }}>{cart.length}</span>
          )}
        </button>
        <button style={tabStyle('history')} onClick={() => handleTabPress('history')}>
          My Sales
        </button>
      </div>

      {/* PRODUCTS */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{ flex: 1, minWidth: 160, padding: '10px 14px',
                borderRadius: 8, border: '1.5px solid #FFB800', fontSize: 13, outline: 'none' }}/>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8,
                border: '1.5px solid #FFB800', fontSize: 13, background: 'white', cursor: 'pointer' }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading products...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#FFF8F0',
              borderRadius: 12, border: '1px dashed #FFB800', color: '#888' }}>
              No products found
            </div>
          ) : (
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
              {filtered.map(product => {
                const inCart = cart.find(i => i.id === product.id);
                const isPressed = pressedProduct === product.id;
                const isLow = product.quantity_in_stock <= product.reorder_level;
                return (
                  <div key={product.id}
                    onClick={() => addToCart(product)}
                    style={{ background: 'white', borderRadius: 12, padding: 16,
                      border: inCart ? '2px solid #FF6B35' : '1px solid #FFE8D0',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      transform: isPressed ? 'scale(0.91)' : 'scale(1)',
                      boxShadow: isPressed
                        ? '0 1px 4px rgba(62,31,0,0.1)'
                        : inCart ? '0 4px 16px rgba(255,107,53,0.2)'
                        : '0 2px 8px rgba(62,31,0,0.06)',
                      userSelect: 'none' }}>
                    <div style={{ fontSize: 10, color: '#FF6B35',
                      textTransform: 'uppercase', letterSpacing: 1,
                      marginBottom: 6, fontWeight: 'bold' }}>
                      {product.category}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#3E1F00',
                      fontSize: 13, marginBottom: 8, lineHeight: 1.3 }}>
                      {product.product}
                    </div>
                    <div style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>
                      MK {fmt(product.unit_price)}
                    </div>
                    <div style={{ fontSize: 11, color: isLow ? '#E65100' : '#2D6A4F' }}>
                      {product.quantity_in_stock} in stock{isLow && ' ⚠'}
                    </div>
                    {inCart && (
                      <div style={{ marginTop: 8, background: '#FF6B35', color: 'white',
                        borderRadius: 6, padding: '3px 0', textAlign: 'center',
                        fontSize: 11, fontWeight: 'bold' }}>
                        {inCart.qty} added ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CART */}
      {activeTab === 'cart' && (
        <div>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60,
              background: '#FFF8F0', borderRadius: 12, border: '1px dashed #FFB800' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                Cart is Empty
              </div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                Go to Products and tap items to add them to your cart
              </div>
              <button onClick={() => handleTabPress('products')}
                style={{ background: '#FF6B35', border: 'none', color: 'white',
                  padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 'bold', fontFamily: 'Arial' }}>
                Browse Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20, alignItems: 'start' }}>

              {/* Items */}
              <div>
                <div style={{ fontWeight: 'bold', color: '#3E1F00', fontSize: 14, marginBottom: 12 }}>
                  Items ({cart.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cart.map(item => (
                    <div key={item.id}
                      style={{ background: 'white', borderRadius: 12, padding: 16,
                        border: '1px solid #FFE8D0', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ fontWeight: 'bold', color: '#3E1F00', fontSize: 13 }}>
                          {item.product}
                        </div>
                        <div style={{ color: '#888', fontSize: 11 }}>MK {fmt(item.unit_price)} each</div>
                        <div style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 13 }}>
                          MK {fmt(item.qty * item.unit_price)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => updateQty(item.id, -1)}
                          style={{ width: 32, height: 32, borderRadius: '50%',
                            background: '#FFF3E8', border: '1px solid #FFE8D0',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>−</button>
                        <span style={{ fontWeight: 'bold', color: '#3E1F00',
                          fontSize: 16, minWidth: 24, textAlign: 'center' }}>
                          {item.qty}
                        </span>
                        <button onClick={() => updateQty(item.id, 1)}
                          style={{ width: 32, height: 32, borderRadius: '50%',
                            background: '#FF6B35', border: 'none', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: 16, color: 'white' }}>+</button>
                        <button onClick={() => removeFromCart(item.id)}
                          style={{ width: 32, height: 32, borderRadius: '50%',
                            background: '#FFEBEE', border: 'none', cursor: 'pointer',
                            color: '#C62828', fontSize: 14 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout */}
              <div style={{ background: 'white', borderRadius: 12, padding: 20,
                border: '1px solid #FFE8D0' }}>
                <div style={{ fontWeight: 'bold', color: '#3E1F00', fontSize: 16, marginBottom: 16 }}>
                  Checkout
                </div>
                <div style={{ background: '#FFF8F0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '4px 0', fontSize: 12, color: '#555',
                      borderBottom: '1px solid #FFE8D0' }}>
                      <span>{item.product} ×{item.qty}</span>
                      <span>MK {fmt(item.qty * item.unit_price)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginTop: 10, fontWeight: 'bold', color: '#3E1F00', fontSize: 16 }}>
                    <span>Total</span>
                    <span style={{ color: '#FF6B35' }}>MK {fmt(cartTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginTop: 4, fontSize: 12, color: '#2D6A4F' }}>
                    <span>Your Profit</span>
                    <span>MK {fmt(cartProfit)}</span>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                    display: 'block', marginBottom: 5 }}>Customer (optional)</label>
                  <input type="text" value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    placeholder="e.g. John Banda"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1.5px solid #FFB800', fontSize: 13, boxSizing: 'border-box' }}/>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                    display: 'block', marginBottom: 5 }}>Payment Method</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Cash', 'Airtel Money', 'TNM Mpamba', 'Bank Transfer'].map(m => (
                      <button key={m} onClick={() => setPayment(m)}
                        style={{ padding: '7px 12px', borderRadius: 8, border: 'none',
                          cursor: 'pointer', fontWeight: 'bold', fontSize: 11,
                          background: payment === m ? '#3E1F00' : '#FFF3E8',
                          color: payment === m ? '#FFB800' : '#888',
                          transition: 'all 0.15s', fontFamily: 'Arial' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleCheckout} disabled={checkoutLoading}
                  style={{ width: '100%', padding: '14px',
                    background: checkoutLoading ? '#AAA' : '#FF6B35',
                    border: 'none', color: 'white', borderRadius: 10,
                    cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold', fontSize: 15, fontFamily: 'Arial', marginBottom: 10 }}>
                  {checkoutLoading ? 'Processing...' : `Complete Sale — MK ${fmt(cartTotal)}`}
                </button>
                <button onClick={() => setCart([])}
                  style={{ width: '100%', padding: '10px', background: 'transparent',
                    border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 10,
                    cursor: 'pointer', fontSize: 13, fontFamily: 'Arial' }}>
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div>
          <div style={{ fontWeight: 'bold', color: '#3E1F00', fontSize: 14, marginBottom: 16 }}>
            My Recent Sales
          </div>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>
          ) : mySales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#FFF8F0',
              borderRadius: 12, border: '1px dashed #FFB800', color: '#888' }}>
              No sales yet. Start selling from the Cart tab!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mySales.map(sale => (
                <div key={sale.id}
                  style={{ background: 'white', borderRadius: 12, padding: 16,
                    border: '1px solid #FFE8D0', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#3E1F00', fontSize: 14 }}>
                      {sale.product}
                    </div>
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {sale.sale_date?.split('T')[0]} · {sale.customer || 'Walk-in'} · {sale.payment}
                    </div>
                    <div style={{ color: '#555', fontSize: 12 }}>
                      Qty: {sale.quantity} · MK {fmt(sale.unit_price)} each
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#FF6B35', fontSize: 16 }}>
                      MK {fmt(sale.quantity * sale.unit_price)}
                    </div>
                    <div style={{ color: '#2D6A4F', fontSize: 12 }}>
                      Profit: MK {fmt(sale.quantity * (sale.unit_price - (sale.unit_cost || 0)))}
                    </div>
                    <span style={{ background: '#E8F5E9', color: '#2E7D32',
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 'bold' }}>
                      {sale.region}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}