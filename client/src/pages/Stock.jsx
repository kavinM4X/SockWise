import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiX,
  FiDollarSign,
  FiBarChart2,
  FiLayers
} from 'react-icons/fi';

const Stock = () => {
  const { products, addStock, updateStock, deleteStock } = useContext(AppContext);

  const [viewProduct, setViewProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [purchase, setPurchase] = useState('');
  const [profit, setProfit] = useState('');
  const [qty, setQty] = useState('');
  const [minstock, setMinstock] = useState('');
  const [desc, setDesc] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'low' | 'healthy'

  // Calculated Inventory Metrics
  const totalValuation = products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.stockQuantity || 0)), 0);
  const totalSKUs = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= p.minimumStock).length;

  useEffect(() => {
    const p = parseFloat(purchase) || 0;
    const pr = parseFloat(profit) || 0;
    setSellingPrice(p + (p * (pr / 100)));
  }, [purchase, profit]);

  const openCreateModal = () => {
    setEditId(null);
    setId('SK-' + String(products.length + 1).padStart(3, '0'));
    setName('');
    setPurchase('');
    setProfit('30'); // default 30% profit margin
    setQty('');
    setMinstock('10');
    setDesc('');
    setShowAddModal(true);
  };

  const handleEdit = (product) => {
    setEditId(product._id);
    setId(product.productId);
    setName(product.productName);
    setPurchase(product.purchasePrice);
    setProfit(product.profitPercentage);
    setQty(product.stockQuantity);
    setMinstock(product.minimumStock);
    setDesc(product.description || '');
    setShowAddModal(true);
  };

  const handleCancelModal = () => {
    setShowAddModal(false);
    setEditId(null);
  };

  const handleSaveStock = async () => {
    const pId = id.trim() || ('SK-' + String(products.length + 1).padStart(3, '0'));
    const pName = name.trim();
    const pPurchase = parseFloat(purchase) || 0;
    const pProfit = parseFloat(profit) || 0;
    const pQty = parseInt(qty) || 0;
    const pMin = parseInt(minstock) || 0;
    const pDesc = desc.trim();

    if (!pName || pPurchase <= 0 || pQty < 0) {
      toast.error('Product name, purchase price & stock quantity are required');
      return;
    }

    const payload = {
      productId: pId,
      productName: pName,
      purchasePrice: pPurchase,
      profitPercentage: pProfit,
      stockQuantity: pQty,
      minimumStock: pMin,
      description: pDesc
    };

    let success = false;
    if (editId) {
      success = await updateStock(editId, payload);
    } else {
      success = await addStock(payload);
    }

    if (success) {
      handleCancelModal();
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteStock(productId);
    }
  };

  // Filter products based on Search & Filter Tabs
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(search.toLowerCase()) ||
                          p.productId.toLowerCase().includes(search.toLowerCase());
    const isLow = p.stockQuantity <= p.minimumStock;

    if (filterTab === 'low') return matchesSearch && isLow;
    if (filterTab === 'healthy') return matchesSearch && !isLow;
    return matchesSearch;
  });

  return (
    <div className="page" id="page-stock">
      
      {/* ===== 1. INVENTORY HEALTH HERO CARD ===== */}
      <div className="stock-hero-card">
        <div className="sh-label">Total Inventory Valuation</div>
        <div className="sh-value">{fmt(totalValuation)}</div>

        <div className="stock-hero-grid">
          <div className="sh-item">
            <div className="sh-item-title">Total SKUs</div>
            <div className="sh-item-val">{totalSKUs}</div>
          </div>
          <div className="sh-item">
            <div className="sh-item-title">Total Units</div>
            <div className="sh-item-val">{totalUnits}</div>
          </div>
          <div className="sh-item">
            <div className="sh-item-title">Low Stock</div>
            <div className="sh-item-val" style={{ color: lowStockCount > 0 ? '#F87171' : '#4ADE80' }}>
              {lowStockCount}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. ACTION HEADER ===== */}
      <div className="stock-action-header">
        <div className="section-title" style={{ margin: 0 }}>
          <span>Product Catalog</span>
          <span className="count">({filteredProducts.length})</span>
        </div>
        <button className="btn-add-product" onClick={openCreateModal}>
          <FiPlus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* ===== 3. SEARCH & FILTER CHIPS ===== */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} size={16} />
        <input 
          type="text" 
          placeholder="Search product by name or ID (SK-...)" 
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
          className={`stock-filter-chip ${filterTab === 'all' ? 'active' : ''}`} 
          onClick={() => setFilterTab('all')}
        >
          All Items ({products.length})
        </button>
        <button 
          className={`stock-filter-chip danger-chip ${filterTab === 'low' ? 'active' : ''}`} 
          onClick={() => setFilterTab('low')}
        >
          <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Low Stock ({lowStockCount})
        </button>
        <button 
          className={`stock-filter-chip ${filterTab === 'healthy' ? 'active' : ''}`} 
          onClick={() => setFilterTab('healthy')}
        >
          Healthy ({products.length - lowStockCount})
        </button>
      </div>

      {/* ===== 4. PRODUCT CARDS LIST ===== */}
      <div>
        {filteredProducts.length === 0 ? (
          <div className="empty-note">
            {search ? `No products matching "${search}"` : 'No inventory items found. Tap "+ Add Product" to create one.'}
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLow = p.stockQuantity <= p.minimumStock;
            const itemValuation = (p.sellingPrice || 0) * (p.stockQuantity || 0);

            return (
              <div 
                className={`product-card-enhanced ${isLow ? 'is-low-stock' : ''}`} 
                key={p._id} 
                onClick={() => setViewProduct(p)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', marginBottom: '2px' }}>
                      {p.productName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ID: {p.productId}
                    </div>
                  </div>
                  <span className={`status-tag ${isLow ? 'low' : 'ok'}`}>
                    {isLow ? <FiAlertTriangle size={11} /> : <FiCheckCircle size={11} />}
                    {isLow ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px', borderTop: '1px dashed var(--line)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      Stock: <strong style={{ color: isLow ? 'var(--danger)' : 'var(--ink)', fontFamily: 'JetBrains Mono' }}>{p.stockQuantity} units</strong> (min {p.minimumStock})
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                      Valuation: <span className="num" style={{ fontWeight: 600 }}>{fmt(itemValuation)}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>
                      {fmt(p.sellingPrice)}
                    </div>
                    <span className="badge-pill success" style={{ fontSize: '9.5px', marginTop: '2px' }}>
                      +{p.profitPercentage}% margin
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== 5. ADD / EDIT PRODUCT MODAL ===== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCancelModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Fraunces, serif' }}>
                {editId ? 'Edit Inventory Item' : 'Add New Product'}
              </h3>
              <FiX size={20} style={{ cursor: 'pointer', color: 'var(--ink-soft)' }} onClick={handleCancelModal} />
            </div>

            <div className="field-dark">
              <div className="field">
                <label>Product ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. SK-001" 
                  value={id} 
                  onChange={e => setId(e.target.value)} 
                />
              </div>
              
              <div className="field">
                <label>Product Name *</label>
                <input 
                  type="text" 
                  placeholder="Cotton Ankle Socks - Black" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="row-2">
                <div className="field">
                  <label>Purchase Cost (₹) *</label>
                  <input 
                    type="number" 
                    placeholder="50" 
                    value={purchase} 
                    onChange={e => setPurchase(e.target.value)} 
                  />
                </div>
                <div className="field">
                  <label>Profit Margin (%)</label>
                  <input 
                    type="number" 
                    placeholder="30" 
                    value={profit} 
                    onChange={e => setProfit(e.target.value)} 
                  />
                </div>
              </div>

              <div className="computed-line">
                <span className="cl-label">Calculated Selling Price</span>
                <span className="cl-value num">{fmt(sellingPrice)}</span>
              </div>

              <div className="row-2">
                <div className="field">
                  <label>Stock Qty *</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    value={qty} 
                    onChange={e => setQty(e.target.value)} 
                  />
                </div>
                <div className="field">
                  <label>Min Stock Alert Threshold</label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    value={minstock} 
                    onChange={e => setMinstock(e.target.value)} 
                  />
                </div>
              </div>

              <div className="field">
                <label>Description / Notes (Optional)</label>
                <textarea 
                  rows="2" 
                  placeholder="Material specs, size, supplier reference..." 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveStock}>
                  {editId ? 'Update Item' : 'Save Product'}
                </button>
                <button 
                  className="btn" 
                  style={{ flex: 1, background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }} 
                  onClick={handleCancelModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 6. PRODUCT DETAIL SPEC SHEET MODAL ===== */}
      {viewProduct && (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontFamily: 'Fraunces, serif' }}>{viewProduct.productName}</h3>
                <p style={{ margin: 0, color: 'var(--ink-soft)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                  ID: {viewProduct.productId}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmt(viewProduct.sellingPrice)}
                </div>
                <span className={`status-tag ${viewProduct.stockQuantity <= viewProduct.minimumStock ? 'low' : 'ok'}`}>
                  {viewProduct.stockQuantity} in stock
                </span>
              </div>
            </div>
            
            <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Purchase Price</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(viewProduct.purchasePrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Profit Margin</span>
                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>+{viewProduct.profitPercentage}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Minimum Required Stock</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>{viewProduct.minimumStock} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px dashed var(--line)', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>Total Stock Valuation</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmt((viewProduct.sellingPrice || 0) * (viewProduct.stockQuantity || 0))}
                </span>
              </div>
            </div>
            
            {viewProduct.description && (
              <div style={{ marginBottom: '20px', fontSize: '13.5px', lineHeight: '1.5', background: 'var(--card)', padding: '12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '4px' }}>Description</div>
                {viewProduct.description}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--primary-tint)', color: 'var(--primary)', border: 'none', gap: '6px' }} 
                onClick={() => { setViewProduct(null); handleEdit(viewProduct); }}
              >
                <FiEdit2 size={14} /> Edit Item
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--danger-tint)', color: 'var(--danger)', border: 'none', gap: '6px' }} 
                onClick={() => { setViewProduct(null); handleDelete(viewProduct._id); }}
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

export default Stock;

