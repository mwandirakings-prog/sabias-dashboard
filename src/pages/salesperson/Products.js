import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Products({ token, user }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saleForm, setSaleForm] = useState({
    quantity: '',
    customer: '',
    payment: 'Cash',
    region: user?.region !== 'all' ? user?.region : '',
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const cid = user?.company_id;
      const res = await axios.get(`${API}/api/inventory?company_id=${cid}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setInventory(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const categories = ['All', ...new Set(inventory.map(i => i.category).filter(Boolean))];

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

  const handleSelectProduct = (product) => {
    if (product.quantity_in_stock === 0) {
      setErrorMsg(`${product.product} is out of stock!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setSelectedProduct(product);
    setSaleForm({
      quantity: '1',
      customer: '',
      payment: 'Cash',
      region: user?.region !== 'all' ? user?.region : '',
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (parseInt(saleForm.quantity) > selectedProduct.quantity_in_stock) {
      setErrorMsg(`Only ${selectedProduct.quantity_in_stock} units available!`);
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await axios.post(`${API}/api/sales`, {
        sale_date: new Date().toISOString().split('T')[0],
        product: selectedProduct.product,
        category: selectedProduct.category,
        region: saleForm.region,
        customer: saleForm.customer,
        quantity: parseInt(saleForm.quantity),
        unit_price: parseFloat(selectedProduct.unit_price),
        unit_cost: parseFloat(selectedProduct.unit_cost),
        salesperson: user?.name,
        payment: saleForm.payment,
        company_id: user?.company_id,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const revenue = saleForm.quantity * selectedProduct.unit_price;
      const profit = saleForm.quantity *
        (selectedProduct.unit_price - selectedProduct.unit_cost);
      setSuccessMsg(
        `✓ Sale recorded! ${saleForm.quantity} x ${selectedProduct.product} — ` +
        `Revenue: MK ${fmt(revenue)} · Profit: MK ${fmt(profit)}`
      );
      setSelectedProduct(null);
      fetchInventory();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg('Failed to record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const revenue = selectedProduct
    ? saleForm.quantity * selectedProduct.unit_price : 0;
  const profit = selectedProduct
    ? saleForm.quantity * (selectedProduct.unit_price - selectedProduct.unit_cost) : 0;

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Product Catalogue
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Click any product to record a sale instantly —{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong>
        </p>
      </div>

      {/* Messages */}
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

      {/* Quick Sale Form — shows when product selected */}
      {selectedProduct && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      marginBottom: 24,
                      border: '2px solid #FF6B35' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 16 }}>
                ⚡ Quick Sale — {selectedProduct.product}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                Unit Price: MK {fmt(selectedProduct.unit_price)} ·
                In Stock: {fmt(selectedProduct.quantity_in_stock)} units ·
                Category: {selectedProduct.category}
              </div>
            </div>
            <button onClick={() => setSelectedProduct(null)}
              style={{ background: '#FFEBEE', border: 'none', color: '#C62828',
                       padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                       fontWeight: 'bold', fontSize: 13 }}>
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSell}>
            <div style={{ display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                                display: 'block', marginBottom: 6 }}>
                  Quantity *
                </label>
                <input type="number" required min="1"
                  max={selectedProduct.quantity_in_stock}
                  value={saleForm.quantity}
                  onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                           border: '1.5px solid #FF6B35', fontSize: 14,
                           boxSizing: 'border-box', fontWeight: 'bold' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                                display: 'block', marginBottom: 6 }}>
                  Customer (optional)
                </label>
                <input type="text" value={saleForm.customer}
                  onChange={(e) => setSaleForm({...saleForm, customer: e.target.value})}
                  placeholder="e.g. Chisomo Store"
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                           border: '1.5px solid #FFB800', fontSize: 13,
                           boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                                display: 'block', marginBottom: 6 }}>
                  Branch/Region *
                </label>
                <input type="text" required value={saleForm.region}
                  onChange={(e) => setSaleForm({...saleForm, region: e.target.value})}
                  placeholder="e.g. Lilongwe"
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                           border: '1.5px solid #FFB800', fontSize: 13,
                           boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                                display: 'block', marginBottom: 6 }}>
                  Payment Method *
                </label>
                <select value={saleForm.payment}
                  onChange={(e) => setSaleForm({...saleForm, payment: e.target.value})}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                           border: '1.5px solid #FFB800', fontSize: 13,
                           boxSizing: 'border-box' }}>
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Credit</option>
                  <option>Bank Transfer</option>
                  <option>Voucher</option>
                </select>
              </div>
            </div>

            {/* Live Preview */}
            {saleForm.quantity > 0 && (
              <div style={{ marginTop: 16, background: '#FFF8F0', borderRadius: 8,
                            padding: '14px 18px', display: 'flex', gap: 32,
                            border: '1px solid #FFE8D0' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Revenue</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2D6A4F' }}>
                    MK {fmt(revenue)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Profit</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#FF6B35' }}>
                    MK {fmt(profit)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Margin</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#FFB800' }}>
                    {selectedProduct.unit_price > 0
                      ? (((selectedProduct.unit_price - selectedProduct.unit_cost) /
                          selectedProduct.unit_price) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Units</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#457B9D' }}>
                    {saleForm.quantity}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <button type="submit" disabled={submitting}
                style={{ background: submitting ? '#AAA' : '#FF6B35',
                         border: 'none', color: 'white',
                         padding: '12px 32px', borderRadius: 8,
                         cursor: submitting ? 'not-allowed' : 'pointer',
                         fontWeight: 'bold', fontSize: 15 }}>
                {submitting ? 'Recording Sale...' : '⚡ Record Sale Now'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: inventory.length, color: '#FF6B35' },
          { label: 'Categories', value: categories.length - 1, color: '#2D6A4F' },
          { label: 'In Stock', value: inventory.filter(i =>
              i.quantity_in_stock > 0).length, color: '#FFB800' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 10,
            padding: '16px 20px', borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 22,
                          fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Product Grid */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20,
                      flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search product, category or supplier..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #FFB800', fontSize: 13, width: 260 }}/>
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
            💡 Click any product card to sell instantly
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ color: '#888' }}>
              No products found. Admin needs to add products to inventory first.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map((p, i) => {
              const status = getStockStatus(p.quantity_in_stock, p.reorder_level);
              const isSelected = selectedProduct?.id === p.id;
              const canSell = p.quantity_in_stock > 0;
              return (
                <div key={i}
                  onClick={() => handleSelectProduct(p)}
                  style={{
                    border: isSelected
                      ? '2px solid #FF6B35'
                      : `1px solid ${canSell ? '#FFE8D0' : '#FFCDD2'}`,
                    borderRadius: 10, padding: 16,
                    background: isSelected ? '#FFF3EE' :
                                canSell ? '#FFFDF8' : '#FFF5F5',
                    cursor: canSell ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected
                      ? '0 4px 12px rgba(255,107,53,0.2)' : 'none',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ color: '#3E1F00', fontWeight: 'bold',
                                  fontSize: 14, flex: 1 }}>
                      {p.product}
                    </div>
                    <span style={{ background: status.bg, color: status.color,
                                   padding: '2px 8px', borderRadius: 10,
                                   fontSize: 10, fontWeight: 'bold',
                                   whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {status.label}
                    </span>
                  </div>

                  <span style={{ background: '#FFF3E0', color: '#E65100',
                                 padding: '2px 8px', borderRadius: 10,
                                 fontSize: 11, marginBottom: 10,
                                 display: 'inline-block' }}>
                    {p.category}
                  </span>

                  <div style={{ display: 'grid',
                                gridTemplateColumns: '1fr 1fr', gap: 8,
                                marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#AAA' }}>Selling Price</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold',
                                    color: '#2D6A4F' }}>
                        MK {fmt(p.unit_price)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#AAA' }}>In Stock</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold',
                                    color: status.color }}>
                        {fmt(p.quantity_in_stock)} units
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#AAA' }}>Supplier</div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {p.supplier || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#AAA' }}>Margin</div>
                      <div style={{ fontSize: 12, fontWeight: 'bold',
                                    color: '#FFB800' }}>
                        {p.unit_price > 0
                          ? (((p.unit_price - p.unit_cost) /
                              p.unit_price) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>

                  {canSell && (
                    <div style={{ marginTop: 12, paddingTop: 10,
                                  borderTop: '1px solid #FFE8D0',
                                  color: '#FF6B35', fontSize: 12,
                                  fontWeight: 'bold', textAlign: 'center' }}>
                      {isSelected ? '✓ Selected — Fill form above' : '👆 Click to Sell'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}