import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCheck, Activity } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="pill pill-cyan">
          <Activity size={12} />
          <span>LIVE CLUSTER</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Environment: <strong>Production</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user?.name || 'Master Admin'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.role ? user.role.toUpperCase() : 'SUPERADMIN'}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="btn btn-secondary" 
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          title="Sign out of Master Admin"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
