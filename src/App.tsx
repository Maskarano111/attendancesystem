/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ScanQR from './pages/ScanQR';
import GenerateQR from './pages/GenerateQR';
import Classes from './pages/Classes';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Home from './pages/Home';
import LecturerDashboard from './pages/LecturerDashboard';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* All authenticated routes use Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lecturer" element={<LecturerDashboard />} />
          <Route path="/scan" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ScanQR />
            </ProtectedRoute>
          } />
          <Route path="/generate-qr" element={
            <ProtectedRoute allowedRoles={['lecturer', 'admin']}>
              <GenerateQR />
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute allowedRoles={['lecturer', 'admin', 'department_head']}>
              <Classes />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin', 'department_head']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'department_head', 'lecturer']}>
              <Reports />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

