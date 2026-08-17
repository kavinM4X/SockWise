import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppProvider>
      <App />
      <Toaster position="bottom-center" toastOptions={{
        style: {
          background: 'var(--ink)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 'var(--radius-s)',
          fontSize: '12.5px',
          fontWeight: 600,
          textAlign: 'center'
        },
        duration: 1800,
      }} />
    </AppProvider>
  </BrowserRouter>
);