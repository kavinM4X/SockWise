import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiCreditCard,
  FiCalendar,
  FiTrash2,
  FiEdit2,
  FiX,
  FiTag,
  FiTrendingDown,
  FiFilter
} from 'react-icons/fi';

const categories = ['Shop Rent', 'Electricity', 'Salary', 'Transport', 'Maintenance', 'Purchase', 'Marketing', 'Miscellaneous'];
const paymentMethods = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

const Expenses = () => {
  const { expenses, addExpenseData, updateExpenseData, deleteExpenseData, expenseStats, currentUser } = useContext(AppContext);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(paymentMethods[0]);
  const [desc, setDesc] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterMethod, setFilterMethod] = useState('All');

  useEffect(() => {
    const handleFabOpen = () => {
      openCreateModal();
    };
    window.addEventListener('open-expense-modal', handleFabOpen);
    return () => window.removeEventListener('open-expense-modal', handleFabOpen);
  }, []);

  // Filtered Expenses
  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                        (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCat === 'All' || e.category === filterCat;
    const matchMethod = filterMethod === 'All' || e.paymentMethod === filterMethod;
    return matchSearch && matchCat && matchMethod;
  });

  const openCreateModal = () => {
    setTitle('');
    setCategory(categories[0]);
    setAmount('');
    setMethod(paymentMethods[0]);
    setDesc('');
    setEditingId(null);
    setShowLogModal(true);
  };

  const startEdit = (e) => {
    setEditingId(e._id);
    setTitle(e.title);
    setCategory(e.category);
    setAmount(e.amount);
    setMethod(e.paymentMethod);
    setDesc(e.description || '');
    setShowLogModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setCategory(categories[0]);
    setAmount('');
    setMethod(paymentMethods[0]);
    setDesc('');
    setEditingId(null);
    setShowLogModal(false);
  };

  const handleSubmit = async () => {
    const t = title.trim();
    const amt = parseFloat(amount) || 0;

    if (!t || amt <= 0) {
      toast.error('Title and a valid amount are required');
      return;
    }

    let success = false;
    if (editingId) {
      success = await updateExpenseData(editingId, {
        title: t,
        category,
        amount: amt,
        paymentMethod: method,
        description: desc
      });
    } else {
      success = await addExpenseData({
        title: t,
        category,
        amount: amt,
        paymentMethod: method,
        description: desc
      });
    }

    if (success) {
      resetForm();
    }
  };

  // Dynamic Real-Time Expense Analytics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayExpenses = expenses.filter(e => new Date(e.expenseDate || e.createdAt) >= todayStart)
                                .reduce((sum, e) => sum + (e.amount || 0), 0);
  const weeklyExpenses = expenses.filter(e => new Date(e.expenseDate || e.createdAt) >= weekStart)
                                 .reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthlyExpenses = expenses.filter(e => new Date(e.expenseDate || e.createdAt) >= monthStart)
                                  .reduce((sum, e) => sum + (e.amount || 0), 0);

  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0);
  });
  let topCategory = 'N/A';
  let maxCatAmount = 0;
  Object.keys(catTotals).forEach(cat => {
    if (catTotals[cat] > maxCatAmount) {
      maxCatAmount = catTotals[cat];
      topCategory = cat;
    }
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      await deleteExpenseData(id);
    }
  };

  return (
    <div className="page" id="page-expenses">
      
      {/* ===== 1. EXPENSE ANALYTICS HERO CARD ===== */}
      <div className="exp-hero-card animate-stagger stagger-1">
        <div className="eh-label">Today's Operating Expenses</div>
        <div className="eh-value">{fmt(todayExpenses)}</div>

        <div className="exp-hero-grid">
          <div className="eh-item">
            <div className="eh-item-title">Weekly</div>
            <div className="eh-item-val">{fmt(weeklyExpenses)}</div>
          </div>
          <div className="eh-item">
            <div className="eh-item-title">Monthly</div>
            <div className="eh-item-val">{fmt(monthlyExpenses)}</div>
          </div>
          <div className="eh-item">
            <div className="eh-item-title">Top Cost</div>
            <div className="eh-item-val" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topCategory}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. ACTION HEADER & FILTERS ===== */}
      <div className="animate-stagger stagger-2">
        <div className="stock-action-header">
          <div className="section-title" style={{ margin: 0 }}>
            <span>Expense Logs</span>
            <span className="count">({filteredExpenses.length})</span>
          </div>
          <button 
            className="btn-add-product" 
            style={{ background: 'var(--danger)' }} 
            onClick={openCreateModal}
          >
            <FiPlus size={16} />
            <span>Log Expense</span>
          </button>
        </div>

      {/* ===== 3. SEARCH & FILTER CHIPS ===== */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} size={16} />
        <input 
          type="text" 
          placeholder="Search expense by title or notes..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 12px 11px 36px',
            borderRadius: 'var(--radius-s)',
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--ink)',
            fontSize: '13.5px',
            fontFamily: 'inherit'
          }}
        />
        {search && (
          <FiX 
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--ink-soft)' }} 
            onClick={() => setSearch('')} 
          />
        )}
      </div>

      <div className="stock-filter-row">
        <button 
          className={`stock-filter-chip ${filterCat === 'All' ? 'active' : ''}`} 
          onClick={() => setFilterCat('All')}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`stock-filter-chip ${filterCat === cat ? 'active' : ''}`} 
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      </div>

      {/* ===== 4. EXPENSE LIST CARDS ===== */}
      <div className="animate-stagger stagger-3">
        {filteredExpenses.length === 0 ? (
          <div className="empty-note">
            {search ? `No expenses matching "${search}"` : 'No expense logs found. Tap "+ Log Expense" to add one.'}
          </div>
        ) : (
          filteredExpenses.map((e) => (
            <div 
              className="list-row" 
              key={e._id} 
              style={{ alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
              onClick={() => setViewExpense(e)}
            >
              <div>
                <div className="lr-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{e.title}</span>
                  <span className="exp-cat-badge">{e.category}</span>
                </div>
                <div className="lr-sub" style={{ marginTop: '4px' }}>
                  <span className={`payment-badge ${e.paymentMethod || 'Cash'}`}>
                    {e.paymentMethod || 'Cash'}
                  </span>
                  <span style={{ marginLeft: '8px' }}>
                    {new Date(e.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                  {e.description && <span style={{ fontStyle: 'italic', marginLeft: '6px' }}>• {e.description}</span>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="lr-amt neg" style={{ fontSize: '16px' }}>{fmt(e.amount)}</div>
                <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginTop: '2px' }}>
                  View Voucher →
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== 5. LOG / EDIT EXPENSE MODAL ===== */}
      {showLogModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-container" onClick={evt => evt.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-heading)' }}>
                {editingId ? 'Edit Expense Record' : 'Log New Expense'}
              </h3>
              <FiX size={20} style={{ cursor: 'pointer', color: 'var(--ink-soft)' }} onClick={resetForm} />
            </div>

            <div className="field-dark">
              <div className="field">
                <label>Expense Title / Vendor *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Electricity bill, Shop rent, Thread purchase" 
                  value={title} 
                  onChange={ev => setTitle(ev.target.value)} 
                />
              </div>

              <div className="row-2">
                <div className="field">
                  <label>Amount (₹) *</label>
                  <input 
                    type="number" 
                    placeholder="450" 
                    value={amount} 
                    onChange={ev => setAmount(ev.target.value)} 
                  />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select value={category} onChange={ev => setCategory(ev.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Payment Method</label>
                <select value={method} onChange={ev => setMethod(ev.target.value)}>
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Description / Remarks (Optional)</label>
                <textarea 
                  rows="2" 
                  placeholder="Invoice ref number, receipt details..." 
                  value={desc} 
                  onChange={ev => setDesc(ev.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--danger)' }} 
                  onClick={handleSubmit}
                >
                  {editingId ? 'Update Expense' : 'Save Expense Log'}
                </button>
                <button 
                  className="btn" 
                  style={{ flex: 1, background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }} 
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 6. DIGITAL EXPENSE VOUCHER RECEIPT MODAL ===== */}
      {viewExpense && (
        <div className="modal-overlay" onClick={() => setViewExpense(null)}>
          <div className="receipt-paper-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="rh-title">{currentUser?.shopName || 'SockWise Store'}</div>
              <div className="rh-inv" style={{ color: 'var(--danger)' }}>Expense Voucher</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                {new Date(viewExpense.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Expense Title:</span>
                <span style={{ fontWeight: 'bold' }}>{viewExpense.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Category:</span>
                <span className="exp-cat-badge">{viewExpense.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Payment Method:</span>
                <span className={`payment-badge ${viewExpense.paymentMethod || 'Cash'}`}>
                  {viewExpense.paymentMethod || 'Cash'}
                </span>
              </div>
            </div>

            {viewExpense.description && (
              <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>Remarks / Notes</div>
                {viewExpense.description}
              </div>
            )}

            <div style={{ fontSize: '13.5px', marginBottom: '20px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', color: 'var(--danger)' }}>
                <span>Total Amount Paid</span>
                <span className="num">{fmt(viewExpense.amount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--primary-tint)', color: 'var(--primary)', border: 'none', gap: '6px' }} 
                onClick={() => { setViewExpense(null); startEdit(viewExpense); }}
              >
                <FiEdit2 size={14} /> Edit Record
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--danger-tint)', color: 'var(--danger)', border: 'none', gap: '4px' }} 
                onClick={() => handleDelete(viewExpense._id)}
              >
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;

