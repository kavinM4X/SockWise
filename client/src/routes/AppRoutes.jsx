import React, { useContext } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AppContext } from '../context/AppContext';

import AppShell from "../components/AppShell";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Stock from "../pages/Stock";
import Sale from "../pages/Sale";
import Expenses from "../pages/Expenses";
import Report from "../pages/Report";
import Customers from "../pages/Customers";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

const PrivateRoute = ({ children }) => {
  const { currentUser } = useContext(AppContext);
  return currentUser ? children : <Navigate to="/login" />;
};

const AuthRoute = ({ children }) => {
  const { currentUser } = useContext(AppContext);
  return currentUser ? <Navigate to="/dashboard" /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/register" element={
        <AuthRoute>
          <Register />
        </AuthRoute>
      } />
      
      <Route 
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/sale" element={<Sale />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/report" element={<Report />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;