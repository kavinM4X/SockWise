import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MasterLayout from './components/MasterLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FleetOverview from './pages/FleetOverview';
import SystemLogs from './pages/SystemLogs';
import SystemSettings from './pages/SystemSettings';

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MasterLayout>
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </MasterLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <MasterLayout>
                    <ErrorBoundary>
                      <UserManagement />
                    </ErrorBoundary>
                  </MasterLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/fleet" 
              element={
                <ProtectedRoute>
                  <MasterLayout>
                    <ErrorBoundary>
                      <FleetOverview />
                    </ErrorBoundary>
                  </MasterLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/logs" 
              element={
                <ProtectedRoute>
                  <MasterLayout>
                    <ErrorBoundary>
                      <SystemLogs />
                    </ErrorBoundary>
                  </MasterLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <MasterLayout>
                    <ErrorBoundary>
                      <SystemSettings />
                    </ErrorBoundary>
                  </MasterLayout>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
