import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--primary)', subtitle }) => {
  return (
    <div className="glass-panel glass-panel-hover stat-card">
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-val">{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            {subtitle}
          </div>
        )}
      </div>
      <div 
        className="stat-icon-wrapper" 
        style={{ 
          background: `rgba(${color}, 0.15)`, 
          color: color, 
          border: `1px solid rgba(${color}, 0.3)` 
        }}
      >
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
};

export default StatCard;
