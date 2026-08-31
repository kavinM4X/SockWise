import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    const success = await login(phone.trim(), password.trim());
    setIsLoading(false);
    if (success) {
      setError(false);
      navigate('/dashboard');
    } else {
      setError(true);
    }
  };

  return (
    <div className="screen active" id="screen-login">
      <div className="brandmark">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2h8v7c0 1.5 1 2.3 1 4.5C17 17.5 15 22 12 22s-5-4.5-5-8.5c0-2.2 1-3 1-4.5V2z" stroke="#DB7B2B" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M8 6h8" stroke="#DB7B2B" strokeWidth="1.6"/>
        </svg>
        <span className="brand-name">SockWise</span>
      </div>
      <div className="brand-sub">Stock, sales &amp; profit — sorted.</div>

      {error && (
        <div className="auth-error" style={{ display: 'block' }}>
          Invalid User ID / Password. Please check your credentials.
        </div>
      )}

      <div className="field">
        <label>Phone number</label>
        <input 
          type="tel" 
          placeholder="Enter phone number" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input 
          type="password" 
          placeholder="Enter password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
      <button className="btn btn-primary" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log in'}
      </button>
      <div className="switch-text">
        New here? <a onClick={() => navigate('/register')}>Create an account</a>
      </div>
    </div>
  );
};

export default Login;
