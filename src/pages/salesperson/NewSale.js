import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function NewSale({ token, user }) {
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    product: '',
    category: '',
    region: user?.region !== 'all' ? user?.region : '',
    customer: '',
    quantity: '',
    unit_price: '',
    unit_cost: '',
    salesperson: user?.name || '',
    payment: 'Cash'
  });

  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

  const revenue = form.quantity && form.unit_price
    ? form.quantity * form.unit_price : 0;
  const profit = form.quantity && form.unit_price && form.unit_cost
    ? form.quantity * (form.unit_price - form.unit_cost) : 0;
  const margin = form.unit_price && form.unit_cost
    ? (((form.unit_price - form.unit_cost) / form.unit_price) * 100).toFixed(1) : 0;

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
      setSuccessMsg(`Sale recorded! Revenue: MK ${fmt(revenue)} · Profit: MK ${fmt(profit)}`);
      setForm({
        sale_date: new Date().toISOString().split('T')[0],
        product: '',
        category: '',
        region: user?.region !== 'all' ? user?.region : '',
        customer: '',
        quantity: '',
        unit_price: '',
        unit_cost: '',
        salesperson: user?.name || '',
        payment: 'Cash'
      });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { label: 'Sale Date', key: 'sale_date', type: 'date', required: true },
    { label: 'Product Name', key: 'product', type: 'text', required: true,
      placeholder: 'e.g. Sugar 2kg' },
    { label: 'Category', key: 'category', type: 'text', required: true,
      placeholder: 'e.g. Groceries' },
    { label: 'Region', key: 'region', type: 'text', required: true,
      placeholder: 'e.g. Lilongwe' },
    { label: 'Customer (optional)', key: 'customer', type: 'text', required: false,
      placeholder: 'e.g. Chisomo Store or leave blank' },
    { label: 'Quantity', key: 'quantity', type: 'number', required: true,
      placeholder: 'e.g. 10' },
    { label: 'Unit Price (MWK)', key: 'unit_price', type: 'number', required: true,
      placeholder: 'e.g. 4500' },
    { label: 'Unit Cost (MWK)', key: 'unit_cost', type: 'number', required: true,
      placeholder: 'e.g. 2800' },
    { label: 'Salesperson', key: 'salesperson', type: 'text', required: true,
      placeholder: 'Your name' },
  ];

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: 900 }}>

      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>Record New Sale</h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Fill in the details below to record a new sales transaction
        </p>
      </div>

      {/* Success */}
      {successMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
                      borderRadius: 10, padding: '14px 18px', marginBottom: 24,
                      color: '#2E7D32', fontWeight: 'bold', fontSize: 14 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2',
                      borderRadius: 10, padding: '14px 18px', marginBottom: 24,
                      color: '#C62828', fontWeight: 'bold', fontSize: 14 }}>
          ⚠ {errorMsg}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 14, padding: 28,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {fields.map(({ label, key, type, required, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: '#555', fontWeight: 'bold',
                                display: 'block', marginBottom: 6 }}>
                  {label} {required && <span style={{ color: '#FF6B35' }}>*</span>}
                </label>
                <input
                  type={type}
                  required={required}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8,
                           border: '1.5px solid #FFB800', fontSize: 13,
                           boxSizing: 'border-box', outline: 'none',
                           background: '#FFFDF8' }}/>
              </div>
            ))}

            {/* Payment Method */}
            <div>
              <label style={{ fontSize: 12, color: '#555', fontWeight: 'bold',
                              display: 'block', marginBottom: 6 }}>
                Payment Method <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <select value={form.payment}
                onChange={(e) => setForm({ ...form, payment: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8,
                         border: '1.5px solid #FFB800', fontSize: 13,
                         boxSizing: 'border-box', background: '#FFFDF8' }}>
                <option>Cash</option>
                <option>Mobile Money</option>
                <option>Credit</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Live Preview */}
          {(revenue > 0 || profit > 0) && (
            <div style={{ marginTop: 24, background: '#FFF8F0', borderRadius: 10,
                          padding: '16px 20px', border: '1px solid #FFE8D0' }}>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 'bold',
                            marginBottom: 12, textTransform: 'uppercase',
                            letterSpacing: 1 }}>
                Live Calculation Preview
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Revenue</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2D6A4F' }}>
                    MK {fmt(revenue)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Profit</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FF6B35' }}>
                    MK {fmt(profit)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Margin</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FFB800' }}>
                    {margin}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>Units</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#457B9D' }}>
                    {fmt(form.quantity)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button type="submit" disabled={submitting}
              style={{ background: submitting ? '#AAA' : '#FF6B35',
                       border: 'none', color: 'white', padding: '12px 32px',
                       borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer',
                       fontWeight: 'bold', fontSize: 15 }}>
              {submitting ? 'Submitting...' : 'Submit Sale'}
            </button>
            <button type="button"
              onClick={() => setForm({
                sale_date: new Date().toISOString().split('T')[0],
                product: '', category: '',
                region: user?.region !== 'all' ? user?.region : '',
                customer: '', quantity: '', unit_price: '', unit_cost: '',
                salesperson: user?.name || '', payment: 'Cash'
              })}
              style={{ background: 'white', border: '1.5px solid #FFB800',
                       color: '#3E1F00', padding: '12px 32px', borderRadius: 8,
                       cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}