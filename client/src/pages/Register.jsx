import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Register = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useContext(AppContext);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setIsLoading(true);
    const success = await register(name.trim(), phone.trim(), email.trim(), password, confirm);
    setIsLoading(false);
    if (success) {
      setError(false);
      navigate('/dashboard');
    } else {
      setError(true);
    }
  };

  return (
    <div className="screen active" id="screen-register">
      <div className="brandmark">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2h8v7c0 1.5 1 2.3 1 4.5C17 17.5 15 22 12 22s-5-4.5-5-8.5c0-2.2 1-3 1-4.5V2z" stroke="#DB7B2B" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M8 6h8" stroke="#DB7B2B" strokeWidth="1.6"/>
        </svg>
        <span className="brand-name">SockWise</span>
      </div>
      <div className="brand-sub">Set up your shop account.</div>

      {error && (
        <div className="auth-error" style={{ display: 'block' }}>
          Please fill all required fields — passwords must match.
        </div>
      )}

      <div className="field">
        <label>Name</label>
        <input 
          type="text" 
          placeholder="Shop owner name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Phone number</label>
        <input 
          type="tel" 
          placeholder="98765 43210" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Email (optional)</label>
        <input 
          type="email" 
          placeholder="you@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Confirm password</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleRegister} disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
      <button className="btn btn-outline-light" onClick={() => navigate('/login')}>Back to log in</button>
    </div>
  );
};

export default Register;
