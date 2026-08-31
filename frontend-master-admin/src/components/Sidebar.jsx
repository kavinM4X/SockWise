import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  FileText, 
  Settings, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { label: 'Master Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'User & Roles', path: '/users', icon: Users },
    { label: 'Fleet & Trips', path: '/fleet', icon: Truck },
    { label: 'Audit Logs', path: '/logs', icon: FileText },
    { label: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <ShieldAlert size={22} />
        </div>
        <div>
          <div className="brand-title">TrackNow</div>
          <div className="brand-badge">MASTER ADMIN</div>
        </div>
      </div>

      <nav className="nav-group">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* External App Links */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>
          Portals & Apps
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.825rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}
          >
            <span>Admin Portal</span>
            <ExternalLink size={12} />
          </a>
          <a 
            href="http://localhost:5173" 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.825rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}
          >
            <span>Client App</span>
            <ExternalLink size={12} />
          </a>
          <a 
            href="http://localhost:5175" 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.825rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}
          >
            <span>Driver App</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
