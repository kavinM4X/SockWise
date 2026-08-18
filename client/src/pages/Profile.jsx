import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import {
  FiBriefcase,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiLock,
  FiLogOut,
  FiCheckCircle,
  FiShield
} from 'react-icons/fi';

const Profile = () => {
  const { currentUser, updateProfile, updatePassword, logout } = useContext(AppContext);
  
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'security' | 'session'

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    ownerName: '',
    address: '',
    gstNumber: '',
    currency: 'INR',
    logo: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        shopName: currentUser.shopName || '',
        ownerName: currentUser.ownerName || '',
        address: currentUser.address || '',
        gstNumber: currentUser.gstNumber || '',
        currency: currentUser.currency || 'INR',
        logo: currentUser.logo || ''
      });
    }
  }, [currentUser]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    const success = await updateProfile(profileData);
    if (success) {
      toast.success('Shop Profile updated successfully!');
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    const success = await updatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    if (success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully!');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'SW';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="page" id="page-profile">
      
      {/* ===== 1. EXECUTIVE STORE BANNER ===== */}
      <div className="profile-banner-card animate-stagger stagger-1">
        <div className="profile-avatar-large">
          {getInitials(profileData.shopName || profileData.ownerName)}
        </div>
        <div className="profile-banner-info">
          <h2 className="pb-name">{profileData.shopName || 'SockWise Store'}</h2>
          <div className="pb-sub">
            Owner: {profileData.ownerName || 'Partner'} • {profileData.phone || 'No Phone'}
          </div>
          {profileData.gstNumber && (
            <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
              GSTIN: {profileData.gstNumber}
            </div>
          )}
        </div>
      </div>

      {/* ===== 2. TAB CONTROLS ===== */}
      <div className="stock-filter-row animate-stagger stagger-2" style={{ marginBottom: '20px' }}>
        <button 
          className={`stock-filter-chip ${activeTab === 'store' ? 'active' : ''}`} 
          onClick={() => setActiveTab('store')}
        >
          🏪 Store Profile
        </button>
        <button 
          className={`stock-filter-chip ${activeTab === 'security' ? 'active' : ''}`} 
          onClick={() => setActiveTab('security')}
        >
          🔐 Security & Password
        </button>
        <button 
          className={`stock-filter-chip ${activeTab === 'session' ? 'active' : ''}`} 
          onClick={() => setActiveTab('session')}
        >
          🚪 Session Controls
        </button>
      </div>

      {/* ===== TAB 1: STORE PROFILE ===== */}
      {activeTab === 'store' && (
        <div className="settings-group-card animate-stagger stagger-3">
          <div className="sg-head">
            <FiBriefcase style={{ color: 'var(--primary)' }} />
            <span>Business Information</span>
          </div>

          <form onSubmit={submitProfile}>
            <div className="field-dark">
              <div className="row-2">
                <div className="field">
                  <label>Shop / Business Name *</label>
                  <input 
                    type="text" 
                    name="shopName" 
                    value={profileData.shopName} 
                    onChange={handleProfileChange} 
                    placeholder="e.g. SockWise Socks Store"
                    required
                  />
                </div>
                <div className="field">
                  <label>Owner Name</label>
                  <input 
                    type="text" 
                    name="ownerName" 
                    value={profileData.ownerName} 
                    onChange={handleProfileChange} 
                    placeholder="Owner / Proprietor name"
                  />
                </div>
              </div>

              <div className="row-2">
                <div className="field">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={profileData.phone} 
                    onChange={handleProfileChange} 
                    placeholder="98765 43210"
                    required 
                  />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={profileData.email} 
                    onChange={handleProfileChange} 
                    placeholder="store@example.com"
                  />
                </div>
              </div>

              <div className="row-2">
                <div className="field">
                  <label>GSTIN / Tax Number</label>
                  <input 
                    type="text" 
                    name="gstNumber" 
                    value={profileData.gstNumber} 
                    onChange={handleProfileChange} 
                    placeholder="33AAAAA0000A1Z5"
                  />
                </div>
                <div className="field">
                  <label>Currency Symbol</label>
                  <select name="currency" value={profileData.currency} onChange={handleProfileChange}>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Business Address</label>
                <textarea 
                  name="address" 
                  value={profileData.address} 
                  onChange={handleProfileChange} 
                  rows="2" 
                  placeholder="Street, City, State, Pincode"
                />
              </div>

              <div className="field">
                <label>Shop Logo URL</label>
                <input 
                  type="url" 
                  name="logo" 
                  value={profileData.logo} 
                  onChange={handleProfileChange} 
                  placeholder="https://example.com/logo.png" 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '14px', gap: '8px' }}>
                <FiCheckCircle size={16} />
                <span>Save Business Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== TAB 2: SECURITY & PASSWORD ===== */}
      {activeTab === 'security' && (
        <div className="settings-group-card">
          <div className="sg-head">
            <FiLock style={{ color: 'var(--accent)' }} />
            <span>Update Account Password</span>
          </div>

          <form onSubmit={submitPassword}>
            <div className="field-dark">
              <div className="field">
                <label>Current Password *</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="••••••••"
                  required 
                />
              </div>

              <div className="row-2">
                <div className="field">
                  <label>New Password *</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={passwordData.newPassword} 
                    onChange={handlePasswordChange} 
                    placeholder="••••••••"
                    required 
                    minLength="3" 
                  />
                </div>
                <div className="field">
                  <label>Confirm New Password *</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={passwordData.confirmPassword} 
                    onChange={handlePasswordChange} 
                    placeholder="••••••••"
                    required 
                    minLength="3" 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '14px', gap: '8px' }}>
                <FiShield size={16} />
                <span>Update Password Credentials</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== TAB 3: SESSION CONTROLS ===== */}
      {activeTab === 'session' && (
        <div className="settings-group-card">
          <div className="sg-head">
            <FiUser style={{ color: 'var(--danger)' }} />
            <span>Active Session Info</span>
          </div>

          <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: 'var(--radius-s)', border: '1px solid var(--line)', marginBottom: '18px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Logged in as:</span>
              <span style={{ fontWeight: 'bold' }}>{currentUser?.name || currentUser?.phone || 'Active User'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Role:</span>
              <span className="exp-cat-badge" style={{ background: 'var(--primary-tint)', color: 'var(--primary-dark)' }}>Administrator</span>
            </div>
          </div>

          <button 
            className="btn" 
            onClick={logout} 
            style={{ width: '100%', padding: '12px', background: 'var(--danger-tint)', color: 'var(--danger)', border: 'none', gap: '8px', fontSize: '14px' }}
          >
            <FiLogOut size={16} />
            <span>Log Out of Account</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default Profile;

