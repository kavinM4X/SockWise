import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import backupService from '../services/backupService';
import toast from 'react-hot-toast';
import {
  FiSliders,
  FiMoon,
  FiSun,
  FiCalendar,
  FiDatabase,
  FiDownload,
  FiUploadCloud,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';

const Settings = () => {
  const { currentUser, updateProfile } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const handleThemeChange = async (e) => {
    const newTheme = e.target.value;
    await updateProfile({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
    toast.success(`Theme updated to ${newTheme} mode`);
  };

  const handleDateFormatChange = async (e) => {
    const newFormat = e.target.value;
    await updateProfile({ dateFormat: newFormat });
    toast.success(`Date format set to ${newFormat}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring database backup will overwrite your current products, sales, and customers. Continue?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const json = JSON.parse(event.target.result);
        await backupService.importDatabase(json);
        toast.success('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Invalid backup file structure');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page" id="page-settings">
      
      {/* ===== 1. SYSTEM PREFERENCES CARD ===== */}
      <div className="settings-group-card">
        <div className="sg-head">
          <FiSliders style={{ color: 'var(--primary)' }} />
          <span>System Preferences</span>
        </div>

        <div className="field-dark">
          <div className="row-2">
            <div className="field">
              <label>Interface Theme Mode</label>
              <select value={currentUser?.theme || 'light'} onChange={handleThemeChange}>
                <option value="light">☀️ Light Theme (Executive Clean)</option>
                <option value="dark">🌙 Dark Theme (OLED Dark Mode)</option>
              </select>
            </div>

            <div className="field">
              <label>System Date Format</label>
              <select value={currentUser?.dateFormat || 'DD/MM/YYYY'} onChange={handleDateFormatChange}>
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 17/08/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/17/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. DATABASE BACKUP & RESTORE CARD ===== */}
      <div className="settings-group-card">
        <div className="sg-head">
          <FiDatabase style={{ color: 'var(--accent)' }} />
          <span>Database Backup & Disaster Recovery</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '16px' }}>
          Export a complete JSON backup copy of your entire store data including products, inventory, sales invoices, expenses, and customer ledgers.
        </p>

        <button 
          className="btn btn-primary" 
          onClick={() => backupService.exportDatabase()} 
          style={{ width: '100%', padding: '13px', gap: '8px', marginBottom: '24px', fontSize: '14px' }}
        >
          <FiDownload size={18} />
          <span>Export Complete Database Backup (JSON)</span>
        </button>

        {/* RESTORE DATABASE SECTION */}
        <div style={{ paddingTop: '16px', borderTop: '1px dashed var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <FiAlertTriangle style={{ color: 'var(--danger)' }} size={16} />
            <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--danger)' }}>Restore Database from Backup</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '14px' }}>
            Selecting a valid <code>.json</code> backup file will replace existing records. Make sure to export a backup before restoring.
          </p>

          <label className="restore-dropzone">
            <FiUploadCloud size={28} style={{ color: 'var(--danger)', marginBottom: '6px' }} />
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>
              {loading ? 'Restoring Backup...' : 'Tap or Drag Backup File (.json)'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              Click to select file from device
            </div>

            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileChange} 
              disabled={loading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

    </div>
  );
};

export default Settings;

