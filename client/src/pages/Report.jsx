import React, { useState, useEffect } from 'react';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';
import reportService from '../services/reportService';
import {
  FiTrendingUp,
  FiPieChart,
  FiAward,
  FiDownload,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiBarChart2,
  FiUsers,
  FiPackage
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler);

const Report = () => {
  const [reportRange, setReportRange] = useState('monthly');
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [reportRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load specific range summary
      let sData;
      if (reportRange === 'weekly') sData = await reportService.getWeekly();
      else if (reportRange === 'monthly') sData = await reportService.getMonthly();
      else if (reportRange === 'yearly') sData = await reportService.getYearly();
      
      setSummary(sData);

      // Load range-filtered charts
      const cData = await reportService.getCharts(reportRange);
      setCharts(cData);

      // Load Top Products & Top Customers once
      if (topProducts.length === 0) {
        const tpData = await reportService.getTopProducts();
        setTopProducts(tpData || []);
      }

      if (topCustomers.length === 0) {
        const tcData = await reportService.getTopCustomers();
        setTopCustomers(tcData || []);
      }
    } catch (error) {
      toast.error('Failed to load analytical reports');
    } finally {
      setLoading(false);
    }
  };

  const palette = ['#28594E', '#DB7B2B', '#3E7D56', '#B84A38', '#8C6A3E', '#5B6169'];

  const lineOptions = {
    plugins: { legend: { display: false } },
    scales: { 
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    },
    maintainAspectRatio: false
  };

  const pieOptions = {
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
    maintainAspectRatio: false
  };

  const doughnutOptions = {
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
    maintainAspectRatio: false,
    cutout: '62%'
  };

  const netProfit = summary ? (summary.revenue - summary.expenses) : 0;
  const profitMarginPercent = (summary && summary.revenue > 0) ? ((netProfit / summary.revenue) * 100).toFixed(1) : 0;

  return (
    <div className="page" id="page-report">

      {/* ===== 1. TIME RANGE TOGGLE ===== */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div className="toggle-pair">
          <button className={reportRange === 'weekly' ? 'active' : ''} onClick={() => setReportRange('weekly')}>
            Weekly
          </button>
          <button className={reportRange === 'monthly' ? 'active' : ''} onClick={() => setReportRange('monthly')}>
            Monthly
          </button>
          <button className={reportRange === 'yearly' ? 'active' : ''} onClick={() => setReportRange('yearly')}>
            Yearly
          </button>
        </div>
      </div>

      {/* ===== 2. FINANCIAL SUMMARY HERO CARD ===== */}
      {summary && (
        <div className="report-hero-card">
          <div className="rh-header">
            <span className="rh-label">{reportRange} Net Profit</span>
            <span className="badge-pill success" style={{ fontSize: '10.5px' }}>
              Margin: {profitMarginPercent}%
            </span>
          </div>
          <div className="rh-value">{fmt(netProfit)}</div>

          <div className="report-grid-stats">
            <div>
              <div className="rg-item-label">Gross Revenue</div>
              <div className="rg-item-val" style={{ color: '#4ADE80' }}>{fmt(summary.revenue)}</div>
            </div>
            <div>
              <div className="rg-item-label">Total Expenses</div>
              <div className="rg-item-val" style={{ color: '#F87171' }}>{fmt(summary.expenses)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 3. VISUAL ANALYTICS CHARTS ===== */}
      {charts && (
        <>
          {/* 6-Month Trend Line Chart */}
          <div className="chart-card">
            <div className="ct-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiTrendingUp style={{ color: 'var(--primary)' }} />
              <span>6-Month Financial Performance</span>
            </div>
            <div className="chart-wrap">
              <Line data={{
                labels: charts.lineChart.labels,
                datasets: [
                  {
                    label: 'Revenue',
                    data: charts.lineChart.revenueTrend,
                    borderColor: '#28594E',
                    backgroundColor: 'rgba(40, 89, 78, 0.08)',
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Expenses',
                    data: charts.lineChart.expenseTrend,
                    borderColor: '#B84A38',
                    backgroundColor: 'transparent',
                    tension: 0.4
                  },
                  {
                    label: 'Net Profit',
                    data: charts.lineChart.profitTrend,
                    borderColor: '#DB7B2B',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderDash: [4, 4]
                  }
                ]
              }} options={{ ...lineOptions, plugins: { legend: { display: true, position: 'top' } } }} />
            </div>

            {/* Monthly Financial Breakdown Summary */}
            {charts.lineChart.labels && charts.lineChart.labels.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--line)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  Monthly Performance Breakdown
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 4px', fontWeight: 600 }}>Month</th>
                        <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right', color: 'var(--primary)' }}>Revenue</th>
                        <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right', color: 'var(--danger)' }}>Expenses</th>
                        <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right', color: 'var(--accent)' }}>Net Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charts.lineChart.labels.map((month, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 700, color: 'var(--ink)' }}>{month}</td>
                          <td className="num" style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                            {fmt(charts.lineChart.revenueTrend[i] || 0)}
                          </td>
                          <td className="num" style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>
                            {fmt(charts.lineChart.expenseTrend[i] || 0)}
                          </td>
                          <td className="num" style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                            {fmt(charts.lineChart.profitTrend[i] || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Sales Channel Distribution */}
            <div className="chart-card">
              <div className="ct-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiPieChart style={{ color: 'var(--accent)' }} />
                  <span>Sales Channel Distribution</span>
                </span>
              </div>
              <div className="chart-wrap" style={{ height: '220px' }}>
                <Pie data={{
                  labels: charts.paymentPie.labels.length > 0 ? charts.paymentPie.labels : ['No Sales Recorded'],
                  datasets: [{
                    data: charts.paymentPie.data.length > 0 ? charts.paymentPie.data : [1],
                    backgroundColor: palette
                  }]
                }} options={pieOptions} />
              </div>

              {/* Data Breakdown List */}
              {charts.paymentPie.labels.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                  {charts.paymentPie.labels.map((lbl, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette[i % palette.length] }}></span>
                        {lbl}
                      </span>
                      <span className="num" style={{ fontWeight: 600 }}>{fmt(charts.paymentPie.data[i] || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Categorization */}
            <div className="chart-card">
              <div className="ct-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiCreditCard style={{ color: 'var(--danger)' }} />
                  <span>Expense Categorization</span>
                </span>
              </div>
              <div className="chart-wrap" style={{ height: '220px' }}>
                <Doughnut data={{
                  labels: charts.categoryDoughnut.labels.length > 0 ? charts.categoryDoughnut.labels : ['No Expenses Recorded'],
                  datasets: [{
                    data: charts.categoryDoughnut.data.length > 0 ? charts.categoryDoughnut.data : [1],
                    backgroundColor: palette
                  }]
                }} options={doughnutOptions} />
              </div>

              {/* Data Breakdown List */}
              {charts.categoryDoughnut.labels.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                  {charts.categoryDoughnut.labels.map((lbl, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette[i % palette.length] }}></span>
                        {lbl}
                      </span>
                      <span className="num" style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(charts.categoryDoughnut.data[i] || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== 4. LEADERBOARDS: TOP PRODUCTS & TOP CUSTOMERS ===== */}
      <div className="leaderboard-card">
        <div className="lb-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiAward style={{ color: 'var(--accent)' }} />
            <span>Top Selling Products</span>
          </span>
          <FiPackage size={14} />
        </div>

        {topProducts.length === 0 ? (
          <div className="empty-note">No product sales data logged yet.</div>
        ) : (
          topProducts.slice(0, 5).map((p, idx) => (
            <div className="leaderboard-item" key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`rank-pill top-${idx + 1}`}>{idx + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>{p.productName || p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{p.totalQuantity || p.quantity || 0} units sold</div>
                </div>
              </div>
              <div className="num" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>
                {fmt(p.totalRevenue || p.revenue || 0)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="leaderboard-card">
        <div className="lb-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiUsers style={{ color: 'var(--primary)' }} />
            <span>Top Customers</span>
          </span>
          <FiAward size={14} />
        </div>

        {topCustomers.length === 0 ? (
          <div className="empty-note">No customer sales data logged yet.</div>
        ) : (
          topCustomers.slice(0, 5).map((c, idx) => (
            <div className="leaderboard-item" key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`rank-pill top-${idx + 1}`}>{idx + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>{c.customerName || c.name || 'Walk-in Client'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{c.totalOrders || c.orders || 1} order(s)</div>
                </div>
              </div>
              <div className="num" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>
                {fmt(c.totalRevenue || c.total || 0)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== 5. EXPORT ACTION ===== */}
      <div style={{ marginTop: '24px' }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', gap: '8px', fontSize: '14px', borderRadius: 'var(--radius-s)' }} 
          onClick={() => reportService.exportPDF()}
        >
          <FiFileText size={18} />
          <span>Export PDF Report</span>
        </button>
      </div>

    </div>
  );
};

export default Report;

