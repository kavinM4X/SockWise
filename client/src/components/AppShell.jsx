import React, { useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/stock': 'Stock',
  '/sale': 'New Sale',
  '/expenses': 'Expenses',
  '/report': 'Reports',
  '/profile': 'Profile',
  '/customers': 'Customers',
  '/settings': 'Settings',
};

const AppShell = () => {
  const { currentUser } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const pageTitle = routeTitles[currentPath] || 'Dashboard';
  
  const showFab = ['/stock', '/sale', '/expenses'].includes(currentPath);

  const initial = currentUser?.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'S';

  const handleFabClick = () => {
    if (currentPath === '/expenses') {
      window.dispatchEvent(new CustomEvent('open-expense-modal'));
    } else if (currentPath === '/stock') {
      window.dispatchEvent(new CustomEvent('open-stock-modal'));
    } else {
      const el = document.getElementById('sale-name');
      if (el) el.focus();
    }
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div id="app-shell">
      <div className="app-header">
        <div className="page-title">{pageTitle}</div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="icon-btn" onClick={() => navigateTo('/settings')} style={{background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer'}}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button className="avatar-btn" onClick={() => navigateTo('/profile')}>
            {initial}
          </button>
        </div>
      </div>

      <div className="app-content" id="app-content">
        <Outlet />
      </div>

      {showFab && (
        <button className="fab" onClick={handleFabClick} title="Quick add">
          <svg viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      <div className="bottom-nav">
        <button
          className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigateTo('/dashboard')}
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Home</span>
        </button>
        <button
          className={`nav-item ${currentPath === '/stock' ? 'active' : ''}`}
          onClick={() => navigateTo('/stock')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M21 8L12 3 3 8v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
          <span>Stock</span>
        </button>
        <button
          className={`nav-item ${currentPath === '/sale' ? 'active' : ''}`}
          onClick={() => navigateTo('/sale')}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="9" cy="20" r="1.3" />
            <circle cx="18" cy="20" r="1.3" />
            <path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h8.4a2 2 0 002-1.7L21 7H6" />
          </svg>
          <span>Sale</span>
        </button>
        <button
          className={`nav-item ${currentPath === '/expenses' ? 'active' : ''}`}
          onClick={() => navigateTo('/expenses')}
        >
          <svg viewBox="0 0 24 24">
            <rect x="2.5" y="6" width="19" height="13" rx="2" />
            <path d="M2.5 10h19M16 14h2" />
          </svg>
          <span>Expense</span>
        </button>
        <button
          className={`nav-item ${currentPath === '/report' ? 'active' : ''}`}
          onClick={() => navigateTo('/report')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 20V10M12 20V4M20 20v-7" />
          </svg>
          <span>Report</span>
        </button>
        <button
          className={`nav-item ${currentPath === '/customers' ? 'active' : ''}`}
          onClick={() => navigateTo('/customers')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Customer</span>
        </button>
      </div>
    </div>
  );
};

export default AppShell;
