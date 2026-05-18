import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [quickForm, setQuickForm] = useState({
    quantity: '1', customer: '', payment: 'Cash',
    region: user?.region !== 'all' ? user?.region : '',
  });
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
      const cid = user?.company_id;
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [s, inv] = await Promise.all([
        axios.get(`${API}/api/sales?company_id=${cid}`, h),
        axios.get(`${API}/api/inventory?company_id=${cid}`, h),
      ]);
      setSales(s.data.data);
      setInventory(inv.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/sales`, {
        ...form,
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
        unit_cost: parseFloat(form.unit_cost),
        company_id: user?.company_id,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg('✓ Sale submitted successfully!');
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

  const handleQuickSell = async (e) => {
    e.preventDefault();
    if (parseInt(quickForm.quantity) > selectedProduct.quantity_in_stock) {
      setErrorMsg(`Only ${selectedProduct.quantity_in_stock} units available!`);
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const rev = parseInt(quickForm.quantity) *
        parseFloat(selectedProduct.unit_price);
      const prof = parseInt(quickForm.quantity) *
        (parseFloat(selectedProduct.unit_price) -
         parseFloat(selectedProduct.unit_cost));
      await axios.post(`${API}/api/sales`, {
        sale_date: saleDate,
        product: selectedProduct.product,
        category: selectedProduct.category,
        region: quickForm.region,
        customer: quickForm.customer,
        quantity: parseInt(quickForm.quantity),
        unit_price: parseFloat(selectedProduct.unit_price),
        unit_cost: parseFloat(selectedProduct.unit_cost),
        salesperson: user?.name,
        payment: quickForm.payment,
        company_id: user?.company_id,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMsg(
        `⚡ Quick Sale done! ${quickForm.quantity} x ${selectedProduct.product} — ` +
        `MK ${fmt(rev)} revenue · MK ${fmt(prof)} profit · Date: ${saleDate}`
      );
      setSelectedProduct(null);
      setQuickForm({
        quantity: '1', customer: '', payment: 'Cash',
        region: user?.region !== 'all' ? user?.region : '',
      });
      setSaleDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg('Failed to record sale. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectProduct = (product) => {
    if (product.quantity_in_stock === 0) {
      setErrorMsg(`${product.product} is out of stock!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setSelectedProduct(product);
    setQuickForm({
      quantity: '1', customer: '', payment: 'Cash',
      region: user?.region !== 'all' ? user?.region : '',
    });
    setErrorMsg('');
  };

  const getStockStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'Out of Stock', color: '#C62828', bg: '#FFEBEE' };
    if (qty <= reorder) return { label: 'Low Stock', color: '#E65100', bg: '#FFF3E0' };
    return { label: 'In Stock', color: '#2E7D32', bg: '#E8F5E9' };
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
          setSelectedProduct(null);
          setErrorMsg('');
        }}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
                   padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 14 }}>
          {showForm ? '✕ Close' : '+ New Sale'}
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
          ⚠ {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
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

      {/* Sale Form Panel */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24,
                        border: '2px solid #FFB800', borderRadius: 10,
                        overflow: 'hidden', width: 'fit-content' }}>
            {[
              { id: 'quick', label: '⚡ Quick Sell', desc: 'Click product → sell' },
              { id: 'manual', label: '✏️ Manual Entry', desc: 'Fill form manually' },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => {
                  setSaleMode(tab.id);
                  setSelectedProduct(null);
                  setErrorMsg('');
                }}
                style={{
                  padding: '12px 28px', border: 'none', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 13,
                  background: saleMode === tab.id ? '#3E1F00' : 'white',
                  color: saleMode === tab.id ? '#FFB800' : '#888',
                }}>
                {tab.label}
                <div style={{ fontSize: 10, fontWeight: 'normal',
                              color: saleMode === tab.id ? '#FFB800' : '#AAA',
                              marginTop: 2 }}>
                  {tab.desc}
                </div>
              </button>
            ))}
          </div>

          {/* QUICK SELL MODE */}
          {saleMode === 'quick' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
                    ⚡ Quick Sell — Click a Product
                  </div>
                  <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                    Click any product card to sell instantly
                  </div>
                </div>
                {/* Silent date picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#888' }}>Sale Date:</span>
                  <input type="date" value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6,
                             border: '1px solid #FFB800', fontSize: 12,
                             color: '#3E1F00', background: '#FFFDF8' }}/>
                </div>
              </div>

              <input placeholder="Search product or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8,
                         border: '1.5px solid #FFB800', fontSize: 13,
                         width: 280, marginBottom: 16 }}/>

              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 10, marginBottom: 20,
                            maxHeight: 320, overflowY: 'auto' }}>
                {filteredInventory.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center',
                                padding: 40, color: '#888' }}>
                    No products found. Admin needs to add products first.
                  </div>
                ) : filteredInventory.map((p, i) => {
                  const status = getStockStatus(
                    p.quantity_in_stock, p.reorder_level);
                  const isSelected = selectedProduct?.id === p.id;
                  const canSell = p.quantity_in_stock > 0;
                  return (
                    <div key={i} onClick={() => handleSelectProduct(p)}
                      style={{
                        border: isSelected ? '2px solid #FF6B35'
                          : `1px solid ${canSell ? '#FFE8D0' : '#FFCDD2'}`,
                        borderRadius: 10, padding: 12,
                        background: isSelected ? '#FFF3EE'
                          : canSell ? '#FFFDF8' : '#FFF5F5',
                        cursor: canSell ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        boxShadow: isSelected
                          ? '0 4px 12px rgba(255,107,53,0.25)' : 'none',
                      }}>
                      <div style={{ fontWeight: 'bold', color: '#3E1F00',
                                    fontSize: 13, marginBottom: 4 }}>
                        {p.product}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                        {p.category}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 'bold',
                                    color: '#2D6A4F' }}>
                        MK {new Intl.NumberFormat('en-US').format(p.unit_price)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', marginTop: 6 }}>
                        <span style={{ background: status.bg, color: status.color,
                                       padding: '1px 6px', borderRadius: 8,
                                       fontSize: 10, fontWeight: 'bold' }}>
                          {p.quantity_in_stock} left
                        </span>
                        {isSelected && (
                          <span style={{ color: '#FF6B35', fontSize: 10,
                                         fontWeight: 'bold' }}>✓ Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedProduct && (
                <div style={{ background: '#FFF8F0', borderRadius: 10,
                              padding: 20, border: '2px solid #FF6B35' }}>
                  <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                fontSize: 15, marginBottom: 4 }}>
                    Selling: {selectedProduct.product}
                  </div>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
                    Price: MK {fmt(selectedProduct.unit_price)} ·
                    Stock: {selectedProduct.quantity_in_stock} units ·
                    Date: {saleDate}
                  </div>
                  <form onSubmit={handleQuickSell}>
                    <div style={{ display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 6 }}>Quantity *</label>
                        <input type="number" required min="1"
                          max={selectedProduct.quantity_in_stock}
                          value={quickForm.quantity}
                          onChange={(e) => setQuickForm({
                            ...quickForm, quantity: e.target.value })}
                          style={{ width: '100%', padding: '9px 11px',
                                   borderRadius: 7, border: '2px solid #FF6B35',
                                   fontSize: 16, fontWeight: 'bold',
                                   boxSizing: 'border-box' }}/>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 6 }}>Customer</label>
                        <input type="text" value={quickForm.customer}
                          placeholder="Walk-in"
                          onChange={(e) => setQuickForm({
                            ...quickForm, customer: e.target.value })}
                          style={{ width: '100%', padding: '9px 11px',
                                   borderRadius: 7, border: '1.5px solid #FFB800',
                                   fontSize: 13, boxSizing: 'border-box' }}/>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 6 }}>Branch *</label>
                        <input type="text" required value={quickForm.region}
                          placeholder="e.g. Lilongwe"
                          onChange={(e) => setQuickForm({
                            ...quickForm, region: e.target.value })}
                          style={{ width: '100%', padding: '9px 11px',
                                   borderRadius: 7, border: '1.5px solid #FFB800',
                                   fontSize: 13, boxSizing: 'border-box' }}/>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#555',
                                        fontWeight: 'bold', display: 'block',
                                        marginBottom: 6 }}>Payment *</label>
                        <select value={quickForm.payment}
                          onChange={(e) => setQuickForm({
                            ...quickForm, payment: e.target.value })}
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

                    {quickForm.quantity > 0 && (
                      <div style={{ display: 'flex', gap: 24, marginBottom: 16,
                                    background: 'white', borderRadius: 8,
                                    padding: '12px 16px',
                                    border: '1px solid #FFE8D0' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA' }}>Revenue</div>
                          <div style={{ fontSize: 18, fontWeight: 'bold',
                                        color: '#2D6A4F' }}>
                            MK {fmt(quickForm.quantity * selectedProduct.unit_price)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA' }}>Profit</div>
                          <div style={{ fontSize: 18, fontWeight: 'bold',
                                        color: '#FF6B35' }}>
                            MK {fmt(quickForm.quantity *
                              (selectedProduct.unit_price -
                               selectedProduct.unit_cost))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA' }}>Margin</div>
                          <div style={{ fontSize: 18, fontWeight: 'bold',
                                        color: '#FFB800' }}>
                            {selectedProduct.unit_price > 0
                              ? (((selectedProduct.unit_price -
                                  selectedProduct.unit_cost) /
                                  selectedProduct.unit_price) * 100).toFixed(1)
                              : 0}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#AAA' }}>Date</div>
                          <div style={{ fontSize: 14, fontWeight: 'bold',
                                        color: '#3E1F00' }}>
                            {saleDate}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={submitting}
                        style={{ background: submitting ? '#AAA' : '#FF6B35',
                                 border: 'none', color: 'white',
                                 padding: '12px 32px', borderRadius: 8,
                                 cursor: submitting ? 'not-allowed' : 'pointer',
                                 fontWeight: 'bold', fontSize: 15 }}>
                        {submitting ? 'Recording...' : '⚡ Record Sale Now'}
                      </button>
                      <button type="button"
                        onClick={() => setSelectedProduct(null)}
                        style={{ background: 'white',
                                 border: '1.5px solid #FFB800',
                                 color: '#3E1F00', padding: '12px 24px',
                                 borderRadius: 8, cursor: 'pointer',
                                 fontWeight: 'bold', fontSize: 14 }}>
                        Change Product
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* MANUAL ENTRY MODE */}
          {saleMode === 'manual' && (
            <div>
              <div style={{ color: '#3E1F00', fontWeight: 'bold',
                            fontSize: 15, marginBottom: 16 }}>
                ✏️ Manual Sale Entry
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
                    { label: 'Unit Price (MWK)', key: 'unit_price', type: 'number' },
                    { label: 'Unit Cost (MWK)', key: 'unit_cost', type: 'number' },
                    { label: 'Salesperson', key: 'salesperson', type: 'text' },
                  ].map(({ label, key, type, required = true }) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, color: '#888',
                                      display: 'block', marginBottom: 4 }}>
                        {label}
                      </label>
                      <input type={type} required={required} value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6,
                                 border: '1px solid #FFB800', fontSize: 13,
                                 boxSizing: 'border-box' }}/>
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 11, color: '#888',
                                    display: 'block', marginBottom: 4 }}>
                      Payment Method
                    </label>
                    <select value={form.payment}
                      onChange={(e) => setForm({ ...form, payment: e.target.value })}
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

                {form.quantity && form.unit_price && (
                  <div style={{ marginTop: 16, background: '#FFF8F0',
                                borderRadius: 8, padding: '12px 16px',
                                display: 'flex', gap: 24 }}>
                    <div>
                      <span style={{ color: '#888', fontSize: 12 }}>Revenue: </span>
                      <strong style={{ color: '#2D6A4F' }}>
                        MK {fmt(form.quantity * form.unit_price)}
                      </strong>
                    </div>
                    {form.unit_cost && (
                      <div>
                        <span style={{ color: '#888', fontSize: 12 }}>Profit: </span>
                        <strong style={{ color: '#FF6B35' }}>
                          MK {fmt(form.quantity * (form.unit_price - form.unit_cost))}
                        </strong>
                      </div>
                    )}
                    {form.unit_cost && form.unit_price && (
                      <div>
                        <span style={{ color: '#888', fontSize: 12 }}>Margin: </span>
                        <strong style={{ color: '#FFB800' }}>
                          {(((form.unit_price - form.unit_cost) /
                            form.unit_price) * 100).toFixed(1)}%
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting}
                    style={{ background: '#FF6B35', border: 'none', color: 'white',
                             padding: '10px 28px', borderRadius: 6,
                             cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                    {submitting ? 'Submitting...' : 'Submit Sale'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                             padding: '10px 28px', borderRadius: 6,
                             cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* My Recent Sales Table */}
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
              style={{ padding: '8px 16px', background: '#FF6B35', border: 'none',
                       borderRadius: 8, color: 'white', cursor: 'pointer',
                       fontSize: 13 }}>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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