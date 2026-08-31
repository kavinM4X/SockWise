import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  const bc = new BroadcastChannel('tracknow_system_channel');
  bc.onmessage = (event) => {
    if (event.data && event.data.type === 'SYSTEM_REBOOT') {
      console.log('⚡ System Reboot Broadcast Received! Reloading tab...');
      window.location.reload();
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
