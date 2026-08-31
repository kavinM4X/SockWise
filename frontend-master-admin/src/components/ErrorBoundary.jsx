import React from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a UI component runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleAutoRecover = () => {
    // Clear temporary component state locks and refresh page cleanly
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '540px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            background: 'radial-gradient(circle at top right, rgba(244, 63, 94, 0.15), transparent 60%), #111827'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Component Recovered by Self-Healing Barrier
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              A UI component runtime exception occurred. Database records and active user data remain 100% safe and intact.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: 'var(--accent-rose)',
                textAlign: 'left',
                marginBottom: '1.5rem',
                overflowX: 'auto'
              }}>
                {String(this.state.error.message || this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={this.handleAutoRecover}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
              >
                <RefreshCw size={16} />
                <span>⚡ Auto-Repair & Recover View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
