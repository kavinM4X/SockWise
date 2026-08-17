import React, { useState, useEffect } from 'react';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';
import customerService from '../services/customerService';
import {
  FiUser,
  FiSearch,
  FiX,
  FiDollarSign,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
  FiUsers
} from 'react-icons/fi';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Healthy'
  
  // Payment Collection Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers({ search, limit: 100 });
      setCustomers(data.customers || []);
    } catch (error) {
      toast.error('Failed to load customer records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadCustomers();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Aggregation Metrics
  const totalPendingTab = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const healthyAccountsCount = customers.filter(c => (c.outstandingBalance || 0) <= 0).length;

  // Filtered Customer List
  const filteredCustomers = customers.filter(c => {
    if (statusFilter === 'Pending') return (c.outstandingBalance || 0) > 0;
    if (statusFilter === 'Healthy') return (c.outstandingBalance || 0) <= 0;
    return true;
  });

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleCollect = (customer) => {
    setSelectedCustomer(customer);
    setAmount(customer.outstandingBalance);
    setShowCollectModal(true);
  };

  const setShortcutAmount = (pct) => {
    if (!selectedCustomer) return;
    const calc = Math.round(selectedCustomer.outstandingBalance * pct);
    setAmount(calc);
  };

  const submitCollect = async (e) => {
    e.preventDefault();
    const parseAmt = parseFloat(amount);
    if (!parseAmt || parseAmt <= 0 || parseAmt > selectedCustomer.outstandingBalance) {
      toast.error('Enter a valid amount to collect');
      return;
    }
    
    try {
      await customerService.collectPayment(selectedCustomer._id, parseAmt);
      toast.success(`Successfully collected ${fmt(parseAmt)} from ${selectedCustomer.customerName}`);
      setShowCollectModal(false);
      loadCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to collect payment');
    }
  };

  return (
    <div className="page" id="page-customers">
      
      {/* ===== 1. CREDIT & CUSTOMER HERO CARD ===== */}
      <div className="cust-hero-card">
        <div className="ch-label">Total Outstanding Credit Tab</div>
        <div className="ch-value">{fmt(totalPendingTab)}</div>

        <div className="cust-hero-grid">
          <div>
            <div className="ch-item-title">Total Clients</div>
            <div className="ch-item-val">{customers.length} accounts</div>
          </div>
          <div>
            <div className="ch-item-title">Healthy (Paid Off)</div>
            <div className="ch-item-val">{healthyAccountsCount} clients</div>
          </div>
        </div>
      </div>

      {/* ===== 2. ACTION HEADER ===== */}
      <div className="stock-action-header">
        <div className="section-title" style={{ margin: 0 }}>
          <span>Customer Ledger</span>
          <span className="count">({filteredCustomers.length})</span>
        </div>
      </div>

      {/* ===== 3. SEARCH & FILTER CHIPS ===== */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} size={16} />
        <input 
          type="text" 
          placeholder="Search by customer name or phone number..." 
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
          className={`stock-filter-chip ${statusFilter === 'All' ? 'active' : ''}`} 
          onClick={() => setStatusFilter('All')}
        >
          All Clients
        </button>
        <button 
          className={`stock-filter-chip ${statusFilter === 'Pending' ? 'active' : ''}`} 
          onClick={() => setStatusFilter('Pending')}
        >
          Credit Pending Tab
        </button>
        <button 
          className={`stock-filter-chip ${statusFilter === 'Healthy' ? 'active' : ''}`} 
          onClick={() => setStatusFilter('Healthy')}
        >
          Healthy Accounts
        </button>
      </div>

      {/* ===== 4. CUSTOMER LIST CARDS ===== */}
      <div>
        {loading ? (
          <div className="empty-note">Loading customer accounts...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-note">
            {search ? `No customer records matching "${search}"` : 'No customer records found.'}
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const hasPending = c.outstandingBalance > 0;

            return (
              <div className="list-row" key={c._id} style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="cust-avatar">{getInitials(c.customerName)}</div>
                  <div>
                    <div className="lr-title" style={{ fontWeight: 700 }}>
                      {c.customerName}
                    </div>
                    <div className="lr-sub" style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiPhone size={12} style={{ color: 'var(--ink-soft)' }} />
                      <span>{c.customerPhone || 'No Phone'}</span>
                      {c.notes && <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>• {c.notes}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div>
                    {hasPending ? (
                      <span className="credit-tab-badge pending">
                        Tab: {fmt(c.outstandingBalance)}
                      </span>
                    ) : (
                      <span className="credit-tab-badge healthy">
                        ✓ Paid & Healthy
                      </span>
                    )}
                  </div>

                  {hasPending && (
                    <div style={{ marginTop: '6px' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '6px' }}
                        onClick={() => handleCollect(c)}
                      >
                        Collect Tab
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== 5. PAYMENT COLLECTION MODAL ===== */}
      {showCollectModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowCollectModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Fraunces, serif' }}>Collect Credit Payment</h3>
              <FiX size={20} style={{ cursor: 'pointer', color: 'var(--ink-soft)' }} onClick={() => setShowCollectModal(false)} />
            </div>

            <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: 'var(--radius-s)', border: '1px solid var(--line)', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{selectedCustomer.customerName}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>Phone: {selectedCustomer.customerPhone || 'N/A'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--line)' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Outstanding Tab:</span>
                <span className="num" style={{ fontWeight: 700, color: '#92400E' }}>{fmt(selectedCustomer.outstandingBalance)}</span>
              </div>
            </div>

            <form onSubmit={submitCollect}>
              <div className="field-dark">
                <div className="field">
                  <label>Collection Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    max={selectedCustomer.outstandingBalance}
                    min={1}
                    autoFocus
                    required
                  />
                </div>

                {/* Quick Amount Shortcuts */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                  <button 
                    type="button" 
                    className="chip" 
                    style={{ flex: 1, fontSize: '11px', textAlign: 'center', justifyContent: 'center' }}
                    onClick={() => setShortcutAmount(1)}
                  >
                    Full ({fmt(selectedCustomer.outstandingBalance)})
                  </button>
                  <button 
                    type="button" 
                    className="chip" 
                    style={{ flex: 1, fontSize: '11px', textAlign: 'center', justifyContent: 'center' }}
                    onClick={() => setShortcutAmount(0.5)}
                  >
                    50% ({fmt(selectedCustomer.outstandingBalance * 0.5)})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Confirm Collection
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-light" 
                    style={{ flex: 1, color: 'var(--ink)', borderColor: 'var(--line)' }} 
                    onClick={() => setShowCollectModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;

