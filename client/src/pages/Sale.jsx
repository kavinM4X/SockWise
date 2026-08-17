import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiUser,
  FiPhone,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiX,
  FiFilter
} from 'react-icons/fi';

const Sale = () => {
  const { products, sales, submitSale, deleteSaleData, currentUser } = useContext(AppContext);

  // Active Terminal Tab: 'newBilling' | 'history'
  const [activeTab, setActiveTab] = useState('newBilling');

  // Customer & Cart Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fittingCharge, setFittingCharge] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Cash');
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState([]);

  // Product Picker Modal State
  const [showProductPickerModal, setShowProductPickerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Sales History state
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [viewReceipt, setViewReceipt] = useState(null);

  const selectedProductObj = products.find(p => p._id === selectedProductId);

  // Filter products for Picker Modal
  const pickerFilteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    p.productId.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handleSelectFromPicker = (product) => {
    if (product.stockQuantity <= 0) {
      toast.error('This product is out of stock!');
      return;
    }
    setSelectedProductId(product._id);
    setShowProductPickerModal(false);
    toast.success(`Selected ${product.productName}`);
  };

  const handleDirectAddFromPicker = (product, e) => {
    e.stopPropagation();
    if (product.stockQuantity <= 0) {
      toast.error('This product is out of stock!');
      return;
    }
    
    const existingIndex = items.findIndex(i => i.productId === product._id);
    if (existingIndex > -1) {
      const updatedItems = [...items];
      const newQty = updatedItems[existingIndex].quantity + 1;
      if (product.stockQuantity < newQty) return toast.error(`Only ${product.stockQuantity} in stock`);
      
      updatedItems[existingIndex].quantity = newQty;
      updatedItems[existingIndex].total = newQty * product.sellingPrice;
      setItems(updatedItems);
      toast.success(`Increased ${product.productName} quantity to ${newQty}`);
    } else {
      setItems([...items, {
        productId: product._id,
        productName: product.productName,
        quantity: 1,
        sellingPrice: product.sellingPrice,
        total: product.sellingPrice
      }]);
      toast.success(`Added ${product.productName} to cart`);
    }
  };

  // POS Daily Metrics
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySalesList = sales.filter(s => s.saleDate && s.saleDate.startsWith(todayDateStr));
  const todayRevenue = todaySalesList.reduce((acc, s) => acc + (s.total || 0), 0);
  const todayInvoiceCount = todaySalesList.length;
  const avgBillValue = todayInvoiceCount > 0 ? (todayRevenue / todayInvoiceCount) : 0;

  // Add Item to Receipt Cart
  const handleAddItem = () => {
    if (!selectedProductId) return toast.error('Please select a product');
    const pQty = parseInt(quantity);
    if (!pQty || pQty <= 0) return toast.error('Enter a valid quantity');

    const product = products.find(p => p._id === selectedProductId);
    if (!product) return toast.error('Product not found');
    if (product.stockQuantity < pQty) return toast.error(`Insufficient stock! Only ${product.stockQuantity} remaining`);

    const existingIndex = items.findIndex(i => i.productId === product._id);
    if (existingIndex > -1) {
      // Update quantity if already in cart
      const updatedItems = [...items];
      const newQty = updatedItems[existingIndex].quantity + pQty;
      if (product.stockQuantity < newQty) return toast.error(`Cannot add more than ${product.stockQuantity} in stock`);
      
      updatedItems[existingIndex].quantity = newQty;
      updatedItems[existingIndex].total = newQty * product.sellingPrice;
      setItems(updatedItems);
      toast.success(`Updated ${product.productName} quantity to ${newQty}`);
    } else {
      setItems([...items, {
        productId: product._id,
        productName: product.productName,
        quantity: pQty,
        sellingPrice: product.sellingPrice,
        total: product.sellingPrice * pQty
      }]);
      toast.success(`Added ${product.productName} to cart`);
    }

    setSelectedProductId('');
    setQuantity('1');
  };

  const updateItemQty = (productId, delta) => {
    const updated = items.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p._id === productId);
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (product && product.stockQuantity < newQty) {
          toast.error(`Only ${product.stockQuantity} in stock`);
          return item;
        }
        return {
          ...item,
          quantity: newQty,
          total: newQty * item.sellingPrice
        };
      }
      return item;
    }).filter(Boolean);

    setItems(updated);
  };

  const removeItem = (pid) => {
    setItems(items.filter(i => i.productId !== pid));
  };

  const subtotal = items.reduce((a, b) => a + b.total, 0);
  const parsedFitting = parseFloat(fittingCharge) || 0;
  const parsedDiscount = parseFloat(discount) || 0;
  const total = Math.max(subtotal + parsedFitting - parsedDiscount, 0);

  const handleSubmit = async () => {
    const sName = name.trim();
    const sPhone = phone.trim();
    const sDiscount = parsedDiscount;
    const sFitting = parsedFitting;
    const sNotes = notes.trim();

    if (items.length === 0) {
      toast.error('Add at least one product item to complete sale');
      return;
    }

    const compiledNotes = [
      sFitting > 0 ? `Fitting Charge: ₹${sFitting}` : '',
      sNotes
    ].filter(Boolean).join(' | ');

    const success = await submitSale({
      customerName: sName,
      customerPhone: sPhone,
      items,
      discount: sDiscount,
      notes: compiledNotes,
      paymentMethod: selectedMethod,
    });

    if (success) {
      setName('');
      setPhone('');
      setFittingCharge('');
      setDiscount('');
      setNotes('');
      setSelectedMethod('Cash');
      setItems([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel & delete this invoice? Product stock will be restored.')) {
      await deleteSaleData(id);
      if (viewReceipt && viewReceipt._id === id) setViewReceipt(null);
    }
  };

  // Filter Sales History
  const filteredSales = sales.filter(s => {
    const matchSearch = (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
                        (s.customerPhone && s.customerPhone.includes(search)) ||
                        (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(search.toLowerCase()));
    const matchMethod = filterMethod === 'All' || s.paymentMethod === filterMethod;
    return matchSearch && matchMethod;
  });

  return (
    <div className="page" id="page-sale">

      {/* ===== 1. POS SUMMARY HEADER ===== */}
      <div className="pos-header-card">
        <div className="pos-label">Today's Sales Revenue</div>
        <div className="pos-value">{fmt(todayRevenue)}</div>

        <div className="pos-grid-stats">
          <div>
            <div className="pg-item-title">Invoices Today</div>
            <div className="pg-item-val">{todayInvoiceCount} bills</div>
          </div>
          <div>
            <div className="pg-item-title">Avg Bill Value</div>
            <div className="pg-item-val">{fmt(avgBillValue)}</div>
          </div>
        </div>
      </div>

      {/* ===== 2. TERMINAL NAVIGATION TABS ===== */}
      <div className="pos-tab-bar">
        <button 
          className={`pos-tab-btn ${activeTab === 'newBilling' ? 'active' : ''}`}
          onClick={() => setActiveTab('newBilling')}
        >
          <FiShoppingCart size={15} />
          <span>New Billing</span>
        </button>
        <button 
          className={`pos-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiFileText size={15} />
          <span>Sales History ({sales.length})</span>
        </button>
      </div>

      {/* ===== 3. NEW BILLING TERMINAL ===== */}
      {activeTab === 'newBilling' && (
        <div className="card-form field-dark">
          <h4 className="subhead" style={{ marginBottom: '14px' }}>Customer Information</h4>
          
          <div className="row-2">
            <div className="field">
              <label>Customer Name</label>
              <input 
                type="text" 
                id="sale-name"
                placeholder="Walk-in Customer" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input 
                type="tel" 
                placeholder="98765 43210" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />
            </div>
          </div>

          <h4 className="subhead" style={{ marginTop: '18px', marginBottom: '14px' }}>Select Products</h4>
          
          <div className="row-2" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Choose Product</label>
              <div 
                className="product-select-trigger" 
                onClick={() => { setPickerSearch(''); setShowProductPickerModal(true); }}
              >
                {selectedProductObj ? (
                  <span>
                    <strong>{selectedProductObj.productName}</strong> ({fmt(selectedProductObj.sellingPrice)})
                  </span>
                ) : (
                  <span className="pst-placeholder">🔍 Tap to search & select product...</span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>Browse →</span>
              </div>
            </div>
            <div className="field">
              <label>Quantity</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  min="1"
                  placeholder="1" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  style={{ width: '75px', textAlign: 'center' }} 
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddItem} 
                  style={{ padding: '12px', width: '46px', height: '46px', flexShrink: 0 }}
                  title="Add to Cart"
                >
                  <FiPlus size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          {items.length > 0 ? (
            <div style={{ marginTop: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Cart Items ({items.length})
              </div>
              
              {items.map((item) => (
                <div className="cart-item-card" key={item.productId}>
                  <div>
                    <div className="cart-item-title">{item.productName}</div>
                    <div className="cart-item-price">{fmt(item.sellingPrice)} × {item.quantity} = <strong>{fmt(item.total)}</strong></div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="cart-stepper">
                      <button className="cart-step-btn" onClick={() => updateItemQty(item.productId, -1)}>
                        <FiMinus size={12} />
                      </button>
                      <span className="cart-step-val">{item.quantity}</span>
                      <button className="cart-step-btn" onClick={() => updateItemQty(item.productId, 1)}>
                        <FiPlus size={12} />
                      </button>
                    </div>
                    
                    <FiTrash2 
                      size={16} 
                      style={{ color: 'var(--danger)', cursor: 'pointer' }} 
                      onClick={() => removeItem(item.productId)} 
                    />
                  </div>
                </div>
              ))}

              <div style={{ background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--line)', marginTop: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Cart Subtotal</span>
                  <span className="num" style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                </div>

                {parsedFitting > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: 'var(--primary)' }}>
                    <span>Fitting Charge</span>
                    <span className="num" style={{ fontWeight: 600 }}>+ {fmt(parsedFitting)}</span>
                  </div>
                )}

                {parsedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: 'var(--danger)' }}>
                    <span>Discount</span>
                    <span className="num" style={{ fontWeight: 600 }}>- {fmt(parsedDiscount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px dashed var(--line)', marginTop: '6px' }}>
                  <span>Total Payable Amount</span>
                  <span className="num" style={{ fontSize: '16px', color: 'var(--primary)' }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-note" style={{ marginTop: '14px', marginBottom: '20px' }}>
              Your cart is empty. Select a product above to add items.
            </div>
          )}

          <div className="row-2" style={{ marginTop: '14px' }}>
            <div className="field">
              <label>Fitting Charge (₹)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={fittingCharge} 
                onChange={e => setFittingCharge(e.target.value)} 
              />
            </div>
            <div className="field">
              <label>Discount (₹)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={discount} 
                onChange={e => setDiscount(e.target.value)} 
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '10px' }}>
            <label>Transaction Notes</label>
            <input 
              type="text" 
              placeholder="Remarks / fitting details..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>

          <h4 className="subhead" style={{ marginTop: '18px', marginBottom: '10px' }}>Payment Method</h4>
          <div className="chip-row">
            {['Cash', 'UPI', 'Card', 'Credit'].map(method => (
              <button 
                key={method} 
                className={`chip ${selectedMethod === method ? 'active' : ''}`} 
                onClick={() => setSelectedMethod(method)}
              >
                {method} {method === 'Credit' ? '(Pending Tab)' : ''}
              </button>
            ))}
          </div>

          <div className="bill-total">
            <span className="bt-label">Total Payable Bill</span>
            <span className="bt-value num">{fmt(total)}</span>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit} style={{ fontSize: '16px', gap: '8px' }}>
            <FiCheckCircle size={18} />
            <span>Complete Sale & Generate Receipt</span>
          </button>
        </div>
      )}

      {/* ===== 4. SALES HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} size={15} />
              <input 
                type="text" 
                placeholder="Search customer, phone, invoice..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  borderRadius: 'var(--radius-s)',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: '13px'
                }}
              />
            </div>

            <select 
              value={filterMethod} 
              onChange={e => setFilterMethod(e.target.value)} 
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-s)',
                background: 'var(--card)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              <option value="All">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <div>
            {filteredSales.length === 0 ? (
              <div className="empty-note">No sales history matching your search.</div>
            ) : (
              filteredSales.map((s) => (
                <div 
                  className="list-row" 
                  key={s._id} 
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={() => setViewReceipt(s)}
                >
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
                      {s.customerPhone ? ` • ${s.customerPhone}` : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="lr-amt pos">{fmt(s.total)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                      View Receipt →
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== 5. DIGITAL INVOICE RECEIPT MODAL ===== */}
      {viewReceipt && (
        <div className="modal-overlay" onClick={() => setViewReceipt(null)}>
          <div className="receipt-paper-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="rh-title">{currentUser?.shopName || 'SockWise Store'}</div>
              <div className="rh-inv">Invoice #{viewReceipt.invoiceNumber || 'INV-000'}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                {new Date(viewReceipt.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Customer:</span>
                <span style={{ fontWeight: 'bold' }}>{viewReceipt.customerName || 'Walk-in Customer'}</span>
              </div>
              {viewReceipt.customerPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Phone:</span>
                  <span style={{ fontWeight: 'bold' }}>{viewReceipt.customerPhone}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Payment Method:</span>
                <span className={`payment-badge ${viewReceipt.paymentMethod || 'Cash'}`}>
                  {viewReceipt.paymentMethod || 'Cash'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '12px 0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                Item Breakdown
              </div>
              {viewReceipt.items && viewReceipt.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span className="num" style={{ fontWeight: 600 }}>{fmt(item.total)}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '13.5px', marginBottom: '20px' }}>
              {viewReceipt.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', marginBottom: '6px' }}>
                  <span>Discount</span>
                  <span>- {fmt(viewReceipt.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>
                <span>Grand Total</span>
                <span className="num">{fmt(viewReceipt.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-outline-light" 
                style={{ flex: 1, color: 'var(--ink)', borderColor: 'var(--line)' }} 
                onClick={() => setViewReceipt(null)}
              >
                Close
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--danger-tint)', color: 'var(--danger)', border: 'none', gap: '4px' }} 
                onClick={() => handleDelete(viewReceipt._id)}
              >
                <FiTrash2 size={14} /> Cancel Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 6. PRODUCT PICKER MINI-PAGE MODAL ===== */}
      {showProductPickerModal && (
        <div className="modal-overlay" onClick={() => setShowProductPickerModal(false)}>
          <div className="modal-container" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Fraunces, serif' }}>Select Product for Cart</h3>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>Tap product card to select or add to cart</div>
              </div>
              <FiX size={20} style={{ cursor: 'pointer', color: 'var(--ink-soft)' }} onClick={() => setShowProductPickerModal(false)} />
            </div>

            {/* Modal Search Bar */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} size={16} />
              <input 
                type="text" 
                placeholder="Search by name, ID (SK-001)..." 
                value={pickerSearch} 
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 36px',
                  borderRadius: 'var(--radius-s)',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13.5px'
                }}
              />
              {pickerSearch && (
                <FiX 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--ink-soft)' }} 
                  onClick={() => setPickerSearch('')} 
                />
              )}
            </div>

            {/* Product List Cards */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '2px' }}>
              {pickerFilteredProducts.length === 0 ? (
                <div className="empty-note">No products matching "{pickerSearch}"</div>
              ) : (
                pickerFilteredProducts.map((p) => {
                  const outOfStock = p.stockQuantity <= 0;
                  const isLow = p.stockQuantity <= p.minimumStock;

                  return (
                    <div 
                      key={p._id}
                      className={`picker-product-card ${outOfStock ? 'disabled-item' : ''}`}
                      onClick={() => handleSelectFromPicker(p)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--ink)' }}>
                          {p.productName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                          ID: {p.productId} • {outOfStock ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>OUT OF STOCK</span> : `${p.stockQuantity} in stock`}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '15px', color: 'var(--primary)' }}>
                            {fmt(p.sellingPrice)}
                          </div>
                        </div>

                        {!outOfStock && (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '6px' }}
                            onClick={(e) => handleDirectAddFromPicker(p, e)}
                            title="Add 1 to cart immediately"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)', textAlign: 'right' }}>
              <button 
                className="btn btn-outline-light" 
                style={{ color: 'var(--ink)', borderColor: 'var(--line)', padding: '10px 18px', width: '100%' }} 
                onClick={() => setShowProductPickerModal(false)}
              >
                Done / Back to Billing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sale;

