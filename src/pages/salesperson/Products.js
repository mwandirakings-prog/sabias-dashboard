import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

export default function Products({ token, user }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cart, setCart] = useState([]);
  const [cartCustomer, setCartCustomer] = useState('');
  const [cartPayment, setCartPayment] = useState('Cash');
  const [cartRegion, setCartRegion] = useState(
    user?.region !== 'all' ? user?.region : ''
  );
  const [saleDate] = useState(new Date().toISOString().split('T')[0]);

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/inventory`,
        { headers: { Authorization: `Bearer ${token}` } });
      setInventory(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const categories = ['All',
    ...new Set(inventory.map(i => i.category).filter(Boolean))];

  const filtered = inventory.filter(p => {
    const matchSearch = search === '' ||
      p.product?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const getStockStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'Out of Stock', color: '#C62828', bg: '#FFEBEE' };
    if (qty <= reorder) return { label: 'Low Stock', color: '#E65100', bg: '#FFF3E0' };
    return { label: 'In Stock', color: '#2E7D32', bg: '#E8F5E9' };
  };

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
          setErrorMsg(`Only ${product.quantity_in_stock} units available!`);
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
    setSuccessMsg('');
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
      setErrorMsg('Cart is empty! Click products to add them.');
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
      fetchInventory();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg('Failed to record sales. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Product Catalogue
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Click products to add to cart —{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong>
        </p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* LEFT — Products */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Products', value: inventory.length, color: '#FF6B35' },
              { label: 'Categories', value: categories.length - 1, color: '#2D6A4F' },
              { label: 'In Stock', value: inventory.filter(i =>
                  i.quantity_in_stock > 0).length, color: '#FFB800' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', borderRadius: 10,
                padding: '14px 18px', borderLeft: `4px solid ${color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#888', fontSize: 12,
                              marginBottom: 4 }}>{label}</div>
                <div style={{ color: '#3E1F00', fontSize: 20,
                              fontWeight: 'bold' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16,
                          flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Search product, category or supplier..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8,
                         border: '1px solid #FFB800', fontSize: 13,
                         width: 240 }}/>
              <select value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8,
                         border: '1px solid #FFB800', fontSize: 13 }}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={fetchInventory}
                style={{ padding: '8px 16px', background: '#FF6B35',
                         border: 'none', borderRadius: 8, color: 'white',
                         cursor: 'pointer', fontSize: 13 }}>
                Refresh
              </button>
              <div style={{ color: '#888', fontSize: 12, marginLeft: 'auto' }}>
                Click products to add to cart
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                Loading products...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ color: '#888' }}>No products found.</div>
              </div>
            ) : (
              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {filtered.map((p, i) => {
                  const status = getStockStatus(
                    p.quantity_in_stock, p.reorder_level);
                  const inCart = cart.find(c => c.id === p.id);
                  const canSell = p.quantity_in_stock > 0;
                  return (
                    <div key={i} onClick={() => addToCart(p)}
                      style={{
                        border: inCart ? '2px solid #FF6B35'
                          : `1px solid ${canSell ? '#FFE8D0' : '#FFCDD2'}`,
                        borderRadius: 10, padding: 14,
                        background: inCart ? '#FFF3EE' :
                                    canSell ? '#FFFDF8' : '#FFF5F5',
                        cursor: canSell ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}>
                      {inCart && (
                        <div style={{ position: 'absolute', top: 8, right: 8,
                                      background: '#FF6B35', color: 'white',
                                      borderRadius: '50%', width: 22, height: 22,
                                      display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', fontSize: 11,
                                      fontWeight: 'bold' }}>
                          {inCart.quantity}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                      fontSize: 13, flex: 1, paddingRight: 24 }}>
                          {p.product}
                        </div>
                        <span style={{ background: status.bg, color: status.color,
                                       padding: '2px 6px', borderRadius: 8,
                                       fontSize: 9, fontWeight: 'bold',
                                       whiteSpace: 'nowrap' }}>
                          {status.label}
                        </span>
                      </div>
                      <span style={{ background: '#FFF3E0', color: '#E65100',
                                     padding: '2px 8px', borderRadius: 8,
                                     fontSize: 10, display: 'inline-block',
                                     marginBottom: 8 }}>
                        {p.category}
                      </span>
                      <div style={{ display: 'grid',
                                    gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div>
                          <div style={{ fontSize: 9, color: '#AAA' }}>Price</div>
                          <div style={{ fontSize: 13, fontWeight: 'bold',
                                        color: '#2D6A4F' }}>
                            MK {fmt(p.unit_price)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: '#AAA' }}>Stock</div>
                          <div style={{ fontSize: 13, fontWeight: 'bold',
                                        color: status.color }}>
                            {fmt(p.quantity_in_stock)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: '#AAA' }}>Supplier</div>
                          <div style={{ fontSize: 11, color: '#888' }}>
                            {p.supplier || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: '#AAA' }}>Margin</div>
                          <div style={{ fontSize: 11, fontWeight: 'bold',
                                        color: '#FFB800' }}>
                            {p.unit_price > 0
                              ? (((p.unit_price - p.unit_cost) /
                                  p.unit_price) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                      {canSell && (
                        <div style={{ marginTop: 10, paddingTop: 8,
                                      borderTop: '1px solid #FFE8D0',
                                      color: inCart ? '#FF6B35' : '#888',
                                      fontSize: 11, fontWeight: 'bold',
                                      textAlign: 'center' }}>
                          {inCart ? `In Cart (${inCart.quantity})` : '+ Add to Cart'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart */}
        <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
          <div style={{ background: '#FFF8F0', borderRadius: 12, padding: 20,
                        border: '2px solid #FF6B35',
                        boxShadow: '0 4px 16px rgba(255,107,53,0.15)' }}>
            <div style={{ color: '#3E1F00', fontWeight: 'bold',
                          fontSize: 18, marginBottom: 4 }}>
              🛒 Cart
              {cart.length > 0 && (
                <span style={{ background: '#FF6B35', color: 'white',
                               fontSize: 12, padding: '2px 10px',
                               borderRadius: 10, marginLeft: 8 }}>
                  {cart.length} item{cart.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px',
                            color: '#AAA' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>Cart is empty</div>
                <div style={{ fontSize: 12 }}>Click products to add them</div>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: 280, overflowY: 'auto',
                              marginBottom: 12, marginTop: 12 }}>
                  {cart.map(item => (
                    <div key={item.id}
                      style={{ background: 'white', borderRadius: 8,
                               padding: '10px 12px', marginBottom: 8,
                               border: '1px solid #FFE8D0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                      fontSize: 13, flex: 1 }}>
                          {item.product}
                        </div>
                        <button onClick={() => removeFromCart(item.id)}
                          style={{ background: '#FFEBEE', border: 'none',
                                   color: '#C62828', borderRadius: 4,
                                   padding: '2px 8px', cursor: 'pointer',
                                   fontSize: 12, marginLeft: 8,
                                   fontWeight: 'bold' }}>
                          ✕
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex',
                                      alignItems: 'center', gap: 6 }}>
                          <button onClick={() => updateCartQty(
                            item.id, item.quantity - 1, item.quantity_in_stock)}
                            style={{ background: '#FFE8D0', border: 'none',
                                     borderRadius: 4, width: 28, height: 28,
                                     cursor: 'pointer', fontWeight: 'bold',
                                     fontSize: 16, display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center' }}>
                            −
                          </button>
                          <input type="number" min="1"
                            max={item.quantity_in_stock}
                            value={item.quantity}
                            onChange={(e) => updateCartQty(
                              item.id, e.target.value, item.quantity_in_stock)}
                            style={{ width: 52, padding: '4px 6px',
                                     borderRadius: 4, border: '1px solid #FFB800',
                                     fontSize: 14, textAlign: 'center',
                                     fontWeight: 'bold' }}/>
                          <button onClick={() => updateCartQty(
                            item.id, item.quantity + 1, item.quantity_in_stock)}
                            style={{ background: '#FFE8D0', border: 'none',
                                     borderRadius: 4, width: 28, height: 28,
                                     cursor: 'pointer', fontWeight: 'bold',
                                     fontSize: 16, display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center' }}>
                            +
                          </button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#2D6A4F', fontWeight: 'bold',
                                        fontSize: 14 }}>
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

                {/* Totals */}
                <div style={{ background: '#3E1F00', borderRadius: 10,
                              padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                marginBottom: 6 }}>
                    <span style={{ color: '#FFB800', fontSize: 13 }}>
                      Total Revenue:
                    </span>
                    <span style={{ color: 'white', fontWeight: 'bold',
                                   fontSize: 16 }}>
                      MK {fmt(cartTotal)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#FFB800', fontSize: 13 }}>
                      Total Profit:
                    </span>
                    <span style={{ color: '#FF6B35', fontWeight: 'bold',
                                   fontSize: 16 }}>
                      MK {fmt(cartProfit)}
                    </span>
                  </div>
                </div>

                {/* Customer & Payment */}
                <div style={{ display: 'flex', flexDirection: 'column',
                              gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#555',
                                    fontWeight: 'bold', display: 'block',
                                    marginBottom: 4 }}>
                      Customer (optional)
                    </label>
                    <input type="text" value={cartCustomer}
                      placeholder="Walk-in customer"
                      onChange={(e) => setCartCustomer(e.target.value)}
                      style={{ width: '100%', padding: '9px 11px',
                               borderRadius: 7, border: '1.5px solid #FFB800',
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
                      style={{ width: '100%', padding: '9px 11px',
                               borderRadius: 7, border: '1.5px solid #FFB800',
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
                      style={{ width: '100%', padding: '9px 11px',
                               borderRadius: 7, border: '1.5px solid #FFB800',
                               fontSize: 13, boxSizing: 'border-box' }}>
                      <option>Cash</option>
                      <option>Mobile Money</option>
                      <option>Credit</option>
                      <option>Bank Transfer</option>
                      <option>Voucher</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCartSubmit} disabled={submitting}
                    style={{ flex: 1, background: submitting
                               ? '#AAA' : '#FF6B35',
                             border: 'none', color: 'white',
                             padding: '14px', borderRadius: 8,
                             cursor: submitting ? 'not-allowed' : 'pointer',
                             fontWeight: 'bold', fontSize: 15 }}>
                    {submitting
                      ? 'Recording...'
                      : `Record ${cart.length} Sale${cart.length > 1 ? 's' : ''}`}
                  </button>
                  <button onClick={() => setCart([])}
                    style={{ background: '#FFEBEE', border: 'none',
                             color: '#C62828', padding: '14px 16px',
                             borderRadius: 8, cursor: 'pointer',
                             fontWeight: 'bold', fontSize: 14 }}>
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}