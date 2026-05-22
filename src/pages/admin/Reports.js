import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function Reports({ token, user }) {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [exporting, setExporting] = useState('');
  const printRef = useRef();

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

  const filteredSales = sales.filter(s => {
    const matchRegion = filterRegion === 'All' || s.region === filterRegion;
    const matchCategory = filterCategory === 'All' ||
      s.category === filterCategory;
    const matchFrom = !dateFrom || s.sale_date?.split('T')[0] >= dateFrom;
    const matchTo = !dateTo || s.sale_date?.split('T')[0] <= dateTo;
    return matchRegion && matchCategory && matchFrom && matchTo;
  });

  const uniqueRegions = ['All',
    ...new Set(sales.map(s => s.region).filter(Boolean))];
  const uniqueCategories = ['All',
    ...new Set(sales.map(s => s.category).filter(Boolean))];

  const totalRevenue = filteredSales.reduce(
    (sum, s) => sum + parseFloat(s.revenue || 0), 0);
  const totalProfit = filteredSales.reduce(
    (sum, s) => sum + parseFloat(s.profit || 0), 0);
  const totalUnits = filteredSales.reduce(
    (sum, s) => sum + parseInt(s.quantity || 0), 0);
  const margin = totalRevenue > 0
    ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const exportToCSV = (data, filename, headers, rowFn) => {
    setExporting(filename);
    const csvRows = [headers.join(',')];
    data.forEach(row => csvRows.push(rowFn(row).join(',')));
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(''), 1000);
  };

  const exportSalesCSV = () => {
    exportToCSV(
      filteredSales,
      `SABIAS_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['ID','Date','Product','Category','Region','Customer',
       'Quantity','Unit Price','Revenue','Profit','Margin',
       'Salesperson','Payment'],
      (s) => [
        s.id, s.sale_date?.split('T')[0], s.product, s.category,
        s.region, s.customer || 'Walk-in', s.quantity,
        s.unit_price, s.revenue, s.profit,
        s.margin ? (parseFloat(s.margin) * 100).toFixed(1) + '%' : '0%',
        s.salesperson, s.payment
      ]
    );
  };

  const exportInventoryCSV = () => {
    exportToCSV(
      inventory,
      `SABIAS_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['ID','Product','Category','Unit Price','Unit Cost',
       'Qty In Stock','Reorder Level','Stock Value','Supplier','Status'],
      (i) => {
        const status = i.quantity_in_stock === 0 ? 'Out of Stock'
          : i.quantity_in_stock <= i.reorder_level ? 'Low Stock' : 'In Stock';
        return [
          i.id, i.product, i.category, i.unit_price, i.unit_cost,
          i.quantity_in_stock, i.reorder_level,
          i.quantity_in_stock * i.unit_price, i.supplier, status
        ];
      }
    );
  };

  const exportSummaryCSV = () => {
    const summaryData = [
      { label: 'Report Generated', value: new Date().toLocaleString() },
      { label: 'Company', value: user?.company || 'SABIAS' },
      { label: 'Total Transactions', value: filteredSales.length },
      { label: 'Total Revenue', value: `MK ${fmt(totalRevenue)}` },
      { label: 'Total Profit', value: `MK ${fmt(totalProfit)}` },
      { label: 'Profit Margin', value: `${margin}%` },
      { label: 'Total Units Sold', value: fmt(totalUnits) },
      { label: 'Date From', value: dateFrom || 'All time' },
      { label: 'Date To', value: dateTo || 'All time' },
      { label: 'Region Filter', value: filterRegion },
      { label: 'Category Filter', value: filterCategory },
    ];
    exportToCSV(
      summaryData,
      `SABIAS_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['Metric', 'Value'],
      (row) => [row.label, row.value]
    );
  };

  const printReport = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SABIAS Report — ${user?.company || 'Sales Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #3E1F00; }
            .meta { color: #888; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #3E1F00; color: #FFB800; padding: 8px 10px;
                 text-align: left; }
            td { padding: 7px 10px; border-bottom: 1px solid #FFE8D0; }
            tr:nth-child(even) { background: #FFF8F0; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; }
            .kpi { border-left: 4px solid #FF6B35; padding: 10px 14px;
                   background: #FFF8F0; border-radius: 6px; }
            .kpi-label { font-size: 11px; color: #888; }
            .kpi-value { font-size: 16px; font-weight: bold; color: #3E1F00; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>SABIAS Sales Report — ${user?.company || ''}</h2>
          <div class="meta">
            Generated: ${new Date().toLocaleString()} |
            Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'} |
            Region: ${filterRegion} | Category: ${filterCategory}
          </div>
          <div class="summary">
            <div class="kpi">
              <div class="kpi-label">Transactions</div>
              <div class="kpi-value">${filteredSales.length}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Total Revenue</div>
              <div class="kpi-value">MK ${fmt(totalRevenue)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Total Profit</div>
              <div class="kpi-value">MK ${fmt(totalProfit)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Profit Margin</div>
              <div class="kpi-value">${margin}%</div>
            </div>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80,
                  color: '#3E1F00', fontSize: 18 }}>
      Loading Reports...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 22 }}>
          Reports & Export
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
          Generate and export business reports for{' '}
          <strong style={{ color: '#FF6B35' }}>
            {user?.company || 'Your Company'}
          </strong>
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                      marginBottom: 16, fontSize: 15 }}>
          Report Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                            display: 'block', marginBottom: 6 }}>
              Date From
            </label>
            <input type="date" value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                       border: '1.5px solid #FFB800', fontSize: 13,
                       boxSizing: 'border-box' }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                            display: 'block', marginBottom: 6 }}>
              Date To
            </label>
            <input type="date" value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                       border: '1.5px solid #FFB800', fontSize: 13,
                       boxSizing: 'border-box' }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                            display: 'block', marginBottom: 6 }}>
              Branch
            </label>
            <select value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                       border: '1.5px solid #FFB800', fontSize: 13,
                       boxSizing: 'border-box' }}>
              {uniqueRegions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 'bold',
                            display: 'block', marginBottom: 6 }}>
              Category
            </label>
            <select value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 7,
                       border: '1.5px solid #FFB800', fontSize: 13,
                       boxSizing: 'border-box' }}>
              {uniqueCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => {
          setDateFrom(''); setDateTo('');
          setFilterRegion('All'); setFilterCategory('All');
        }}
          style={{ marginTop: 12, background: 'none',
                   border: '1px solid #FFB800', color: '#3E1F00',
                   padding: '6px 16px', borderRadius: 6,
                   cursor: 'pointer', fontSize: 12 }}>
          Clear Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Transactions',
            value: filteredSales.length, color: '#FF6B35' },
          { label: 'Total Revenue',
            value: `MK ${fmt(totalRevenue)}`, color: '#2D6A4F' },
          { label: 'Total Profit',
            value: `MK ${fmt(totalProfit)}`, color: '#FFB800' },
          { label: 'Profit Margin',
            value: `${margin}%`, color: '#457B9D' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12,
            padding: 20, borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ color: '#888', fontSize: 12,
                          marginBottom: 8 }}>{label}</div>
            <div style={{ color: '#3E1F00', fontSize: 18,
                          fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        fontSize: 16, marginBottom: 8 }}>Sales Report</div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
            Export {filteredSales.length} transactions
          </div>
          <button onClick={exportSalesCSV} disabled={exporting !== ''}
            style={{ background: '#FF6B35', border: 'none', color: 'white',
                     padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
                     fontWeight: 'bold', fontSize: 14, width: '100%' }}>
            {exporting.includes('Sales')
              ? 'Exporting...' : 'Export Sales CSV'}
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        fontSize: 16, marginBottom: 8 }}>Inventory Report</div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
            Export {inventory.length} products
          </div>
          <button onClick={exportInventoryCSV} disabled={exporting !== ''}
            style={{ background: '#2D6A4F', border: 'none', color: 'white',
                     padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
                     fontWeight: 'bold', fontSize: 14, width: '100%' }}>
            {exporting.includes('Inventory')
              ? 'Exporting...' : 'Export Inventory CSV'}
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: '#3E1F00', fontWeight: 'bold',
                        fontSize: 16, marginBottom: 8 }}>Summary Report</div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
            Export KPI summary with filters
          </div>
          <button onClick={exportSummaryCSV} disabled={exporting !== ''}
            style={{ background: '#FFB800', border: 'none', color: '#3E1F00',
                     padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
                     fontWeight: 'bold', fontSize: 14, width: '100%' }}>
            {exporting.includes('Summary')
              ? 'Exporting...' : 'Export Summary CSV'}
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center' }}>
        <div>
          <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 15 }}>
            Print Report
          </div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
            Prints only the report preview table below
          </div>
        </div>
        <button onClick={printReport}
          style={{ background: '#3E1F00', border: 'none', color: '#FFB800',
                   padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 14 }}>
          Print Report
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ color: '#3E1F00', fontWeight: 'bold',
                      fontSize: 15, marginBottom: 16 }}>
          Report Preview — {filteredSales.length} Records
        </div>
        <div ref={printRef} style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse',
                          fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#3E1F00' }}>
                {['Date','Product','Category','Branch','Customer',
                  'Qty','Revenue','Profit','Salesperson','Payment'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#FFB800',
                    textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 20).map((s, i) => (
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
                    {s.quantity}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right',
                               color: '#2D6A4F', fontWeight: '500' }}>
                    MK {fmt(s.revenue)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right',
                               color: '#FF6B35', fontWeight: '500' }}>
                    MK {fmt(s.profit)}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{s.salesperson}</td>
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
          {filteredSales.length > 20 && (
            <div style={{ textAlign: 'center', padding: 12, color: '#888',
                          fontSize: 12,
                          borderTop: '1px solid #FFE8D0' }}>
              Showing 20 of {filteredSales.length} records.
              Export CSV to see all records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}