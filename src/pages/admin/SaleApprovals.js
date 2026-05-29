import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';
const fmt = (n) => 'MWK ' + new Intl.NumberFormat().format(Math.round(n || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

export default function SaleApprovals({ token, user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  const h = { headers: { Authorization: `Bearer ${token}` } };

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/sales?include_all=true`, h);
      setSales(res.data.data || []);
    } catch (err) {
      setErrorMsg('Failed to load sales.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleApprove = async (sale) => {
    setProcessing(sale.id);
    try {
      await axios.put(`${API}/api/sales/${sale.id}/approve`, {}, h);
      showSuccess(`Sale by ${sale.salesperson} approved!`);
      fetchSales();
    } catch (err) {
      setErrorMsg('Failed to approve sale.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (sale) => {
    setProcessing(sale.id);
    try {
      await axios.put(`${API}/api/sales/${sale.id}/reject`, {}, h);
      showSuccess(`Sale rejected and stock restored.`);
      fetchSales();
    } catch (err) {
      setErrorMsg('Failed to reject sale.');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = sales.filter(s => {
    const matchFilter = filter === 'all' || (s.approval_status || 'approved') === filter;
    const matchSearch = search === '' ||
      s.product?.toLowerCase().includes(search.toLowerCase()) ||
      s.salesperson?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pending = sales.filter(s => (s.approval_status || 'approved') === 'pending');
  const approved = sales.filter(s => (s.approval_status || 'approved') === 'approved');
  const rejected = sales.filter(s => s.approval_status === 'rejected');

  const getStatusStyle = (status) => {
    const s = status || 'approved';
    if (s === 'pending') return { bg: '#FFF8E1', color: '#E65100', border: '#FFE082', label: 'Pending' };
    if (s === 'approved') return { bg: '#E8F5E9', color: '#2D6A4F', border: '#A5D6A7', label: 'Approved' };
    if (s === 'rejected') return { bg: '#FFEBEE', color: '#C62828', border: '#FFCDD2', label: 'Rejected' };
    return { bg: '#F5F5F5', color: '#888', border: '#DDD', label: s };
  };

  return (
    <div style={{ fontFamily: 'Arial' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: '0 0 4px', fontSize: 20 }}>
          Sale Approvals
        </h2>
        <p style={{ color: '#888', margin: 0, fontSize: 13 }}>
          Review and approve or reject sales recorded by your team.
          {pending.length > 0 && (
            <span style={{ background: '#E65100', color: 'white',
              fontSize: 11, padding: '2px 8px', borderRadius: 10,
              marginLeft: 8, fontWeight: 'bold' }}>
              {pending.length} pending
            </span>
          )}
        </p>
      </div>

      {/* Messages */}
      {actionMsg && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          color: '#2D6A4F', fontWeight: 'bold' }}>
          ✓ {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          color: '#C62828', fontWeight: 'bold' }}>
          {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pending', value: pending.length, color: '#E65100', bg: '#FFF8E1' },
          { label: 'Approved', value: approved.length, color: '#2D6A4F', bg: '#E8F5E9' },
          { label: 'Rejected', value: rejected.length, color: '#C62828', bg: '#FFEBEE' },
          { label: 'Total Sales', value: sales.length, color: '#3E1F00', bg: '#FFF8F0' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: bg, borderRadius: 10, padding: '14px 16px',
            border: `1px solid ${color}33`,
          }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontSize: 24, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* How it works box */}
      <div style={{
        background: '#FFF8E1', border: '1px solid #FFE082',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        borderLeft: '4px solid #E65100',
      }}>
        <div style={{ color: '#E65100', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
          How Sale Approval Works
        </div>
        <div style={{ color: '#555', fontSize: 12, lineHeight: 1.6 }}>
          When a salesperson records a sale, it is marked <strong>Pending</strong> until you approve it.
          Stock is deducted immediately on submission. If you <strong>Reject</strong> a sale, 
          the stock is restored automatically. Approved sales count in analytics and reports.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search product, salesperson, customer..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8,
            border: '1.5px solid #FFE8D0', fontSize: 13,
            flex: 1, minWidth: 200, outline: 'none',
            background: '#FFFDF8' }}/>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 12, border: 'none',
              background: filter === f ? '#3E1F00' : '#F5F0EB',
              color: filter === f ? '#FFB800' : '#888',
              fontFamily: 'Arial', textTransform: 'capitalize',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Sales List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
          Loading sales...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            {filter === 'pending' ? '✅' : '📋'}
          </div>
          <div style={{ fontWeight: 'bold', color: '#3E1F00', marginBottom: 8 }}>
            {filter === 'pending' ? 'No pending sales!' : 'No sales found'}
          </div>
          <div style={{ fontSize: 13 }}>
            {filter === 'pending' ? 'All sales are up to date.' : 'Try changing your filter.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(sale => {
            const status = sale.approval_status || 'approved';
            const st = getStatusStyle(status);
            const revenue = sale.quantity * sale.unit_price;
            const profit = sale.quantity * (sale.unit_price - sale.unit_cost);
            const isPending = status === 'pending';
            const isProcessing = processing === sale.id;

            return (
              <div key={sale.id} style={{
                background: 'white', borderRadius: 12,
                border: `1px solid ${isPending ? '#FFE082' : '#FFE8D0'}`,
                padding: '16px',
                borderLeft: `4px solid ${st.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>

                  {/* Sale Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 'bold', color: '#3E1F00', fontSize: 15 }}>
                        {sale.product}
                      </span>
                      <span style={{
                        background: st.bg, color: st.color,
                        fontSize: 10, padding: '2px 8px', borderRadius: 8,
                        fontWeight: 'bold', border: `1px solid ${st.border}`
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '4px 16px', fontSize: 12, color: '#666' }}>
                      <div>Salesperson: <strong style={{ color: '#3E1F00' }}>{sale.salesperson}</strong></div>
                      <div>Date: <strong style={{ color: '#3E1F00' }}>{fmtDate(sale.sale_date)}</strong></div>
                      <div>Qty: <strong style={{ color: '#3E1F00' }}>{sale.quantity}</strong></div>
                      <div>Category: <strong style={{ color: '#3E1F00' }}>{sale.category || '—'}</strong></div>
                      <div>Customer: <strong style={{ color: '#3E1F00' }}>{sale.customer || '—'}</strong></div>
                      <div>Payment: <strong style={{ color: '#3E1F00' }}>{sale.payment}</strong></div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#3E1F00' }}>
                      {fmt(revenue)}
                    </div>
                    <div style={{ fontSize: 12, color: '#2D6A4F' }}>
                      Profit: {fmt(profit)}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      @ {fmt(sale.unit_price)}/unit
                    </div>
                  </div>
                </div>

                {/* Action Buttons — only for pending */}
                {isPending && (
                  <div style={{
                    display: 'flex', gap: 10, marginTop: 14,
                    paddingTop: 14, borderTop: '1px solid #FFE8D0',
                    flexWrap: 'wrap',
                  }}>
                    <button
                      onClick={() => handleApprove(sale)}
                      disabled={isProcessing}
                      style={{
                        background: isProcessing ? '#AAA' : '#2D6A4F',
                        border: 'none', color: 'white',
                        padding: '9px 20px', borderRadius: 8,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial',
                      }}>
                      {isProcessing ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(sale)}
                      disabled={isProcessing}
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #C62828', color: '#C62828',
                        padding: '9px 20px', borderRadius: 8,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial',
                      }}>
                      {isProcessing ? '...' : '✕ Reject'}
                    </button>
                    <div style={{ marginLeft: 'auto', color: '#888', fontSize: 12,
                      display: 'flex', alignItems: 'center' }}>
                      Sale #{sale.id}
                    </div>
                  </div>
                )}

                {/* Rejected — show note */}
                {status === 'rejected' && (
                  <div style={{ marginTop: 10, paddingTop: 10,
                    borderTop: '1px solid #FFCDD2',
                    color: '#C62828', fontSize: 12 }}>
                    ✕ Rejected — stock restored. Sale #{sale.id}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
