import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { fmt } from '../utils/helpers';
import reportService from '../services/reportService';
import {
  FiTrendingUp,
  FiDollarSign,
  FiCreditCard,
  FiAlertTriangle,
  FiPlus,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiArrowUpRight,
  FiClock
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const Dashboard = () => {
  const { dashboardStats, lowStockProducts, sales: salesList, currentUser } = useContext(AppContext);
  const navigate = useNavigate();

  const [charts, setCharts] = useState(null);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        const cData = await reportService.getCharts();
        setCharts(cData);
      } catch (err) {
        console.error('Failed to load dashboard chart', err);
      }
    };
    loadCharts();
  }, []);

  if (!dashboardStats) return <div className="page"><div className="empty-note">Loading command center...</div></div>;

  const { inventory, sales, revenue, expenses, customers, business } = dashboardStats;

  const shopTitle = currentUser?.shopName || 'SockWise Store';
  const ownerGreeting = currentUser?.ownerName || currentUser?.name || 'Partner';
  const todayDateStr = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  // Get recent 5 sales for activity feed
  const recentSales = salesList.slice(0, 5);

  const lineOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="page" id="page-dashboard">
      
      {/* ===== 1. WELCOME BANNER ===== */}
      <div className="dash-welcome-banner animate-stagger stagger-1">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="dw-greeting">Hello, {ownerGreeting} 👋</div>
            <div className="dw-sub">{shopTitle} • {todayDateStr}</div>
          </div>
          <div className="dw-status-pill">
            <span className="dw-dot"></span>
            <span>Live System</span>
          </div>
        </div>
      </div>

      {/* ===== 2. QUICK ACTION SHORTCUTS ===== */}
      <div className="quick-actions-bar animate-stagger stagger-2">
        <button className="quick-act-btn primary-act" onClick={() => navigate('/sale')}>
          <FiPlus />
          <span>New Sale</span>
        </button>
        <button className="quick-act-btn" onClick={() => navigate('/stock')}>
          <FiPackage />
          <span>Add Stock</span>
        </button>
        <button className="quick-act-btn" onClick={() => navigate('/expenses')}>
          <FiCreditCard />
          <span>Log Expense</span>
        </button>
      </div>

      {/* ===== 3. HERO KPI METRIC GRID ===== */}
      <div className="stat-grid animate-stagger stagger-3" style={{ marginBottom: '20px' }}>
        
        {/* Today's Sales Card */}
        <div className="kpi-card accent-card">
          <div className="kpi-header">
            <span className="kpi-title">Today's Sales</span>
            <div className="kpi-icon-wrap">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{fmt(sales.todaySales)}</div>
          <div className="kpi-footer">
            <span>Weekly: {fmt(sales.weeklySales)}</span>
          </div>
        </div>

        {/* Today's Expenses Card */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Today's Expenses</span>
            <div className="kpi-icon-wrap" style={{ background: 'var(--danger-tint)', color: 'var(--danger)' }}>
              <FiCreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{fmt(expenses.todayExpenses)}</div>
          <div className="kpi-footer">
            <span className="badge-pill danger">Mo: {fmt(expenses.monthlyExpenses)}</span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Profit</span>
            <div className="kpi-icon-wrap" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
              <FiDollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary)' }}>{fmt(revenue.netProfit)}</div>
          <div className="kpi-footer">
            <span className="badge-pill success">Mo: {fmt(revenue.monthlyProfit)}</span>
          </div>
        </div>

        {/* Pending Credit Card */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Credit</span>
            <div className="kpi-icon-wrap" style={{ background: 'var(--accent-tint)', color: '#8A4A15' }}>
              <FiAlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: customers.pendingCredit > 0 ? 'var(--danger)' : 'var(--ink)' }}>
            {fmt(customers.pendingCredit)}
          </div>
          <div className="kpi-footer">
            <span className="badge-pill warn" onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
              View Customers <FiArrowUpRight size={10} />
            </span>
          </div>
        </div>
      </div>

      {/* ===== 4. EMBEDDED REVENUE TREND CHART ===== */}
      {charts && (
        <div className="chart-card animate-stagger stagger-4">
          <div className="ct-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>6-Month Financial Trend</span>
            <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/report')}>
              Full Reports <FiArrowUpRight />
            </span>
          </div>
          <div className="chart-wrap" style={{ height: '170px' }}>
            <Line
              data={{
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
                  }
                ]
              }}
              options={lineOptions}
            />
          </div>
        </div>
      )}

      {/* ===== 5. INVENTORY & BUSINESS HIGHLIGHTS ===== */}
      <div className="animate-stagger stagger-5">
        <h4 className="subhead" style={{ marginTop: '24px' }}>Inventory & Business Summary</h4>
        <div className="stat-grid" style={{ marginTop: '12px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Products</div>
            <div className="stat-value num" style={{ fontSize: '19px' }}>{inventory.totalProducts}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>{inventory.totalStock} total units</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value num" style={{ fontSize: '19px' }}>{business.totalOrders}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>Avg: {fmt(business.averageOrderValue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-value num" style={{ fontSize: '19px' }}>{fmt(revenue.monthlyRevenue)}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>Total: {fmt(revenue.totalRevenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Top Customer</div>
            <div className="stat-value num" style={{ fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {customers.topCustomer || 'N/A'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>{customers.totalCustomers} customers</div>
          </div>
        </div>

        {/* Actionable Low Stock Alerts */}
        <div className="section-title">
          <span>Low Stock Alerts</span>
          <span className="count">{inventory.lowStock} item{inventory.lowStock !== 1 ? 's' : ''}</span>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          {lowStockProducts.length === 0 ? (
            <div className="empty-note">All inventory levels are healthy.</div>
          ) : (
            lowStockProducts.map((p, idx) => (
              <div className="alert-row" key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="a-name">{p.productName}</div>
                  <div className="a-sub">Min required: {p.minimumStock} | ID: {p.productId}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="a-qty">{p.stockQuantity} left</div>
                  <button className="restock-btn" onClick={() => navigate('/stock')}>
                    Restock
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== 6. RECENT TRANSACTIONS ACTIVITY FEED ===== */}
      <div className="animate-stagger stagger-6">
        <div className="section-title">
          <span>Recent Transactions</span>
          <span className="count">Last {recentSales.length}</span>
        </div>

        <div>
          {recentSales.length === 0 ? (
            <div className="empty-note">No recent transactions recorded.</div>
          ) : (
            recentSales.map((s) => (
              <div className="list-row" key={s._id}>
                <div>
                  <div className="lr-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{s.customerName || 'Walk-in Customer'}</span>
                    <span className={`payment-badge ${s.paymentMethod || 'Cash'}`}>
                      {s.paymentMethod || 'Cash'}
                    </span>
                  </div>
                  <div className="lr-sub">
                    <FiClock style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {new Date(s.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {s.invoiceNumber ? ` • ${s.invoiceNumber}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="lr-amt pos">{fmt(s.total)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                    {s.items ? `${s.items.length} item(s)` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

