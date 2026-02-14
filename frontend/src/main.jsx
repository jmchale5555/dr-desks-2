import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import RootLayout from './components/layout/RootLayout';
import BookingApp from './apps/booking/BookingApp';
import MyBookings from './apps/mybookings/MyBookings';
import AdminApp from './apps/admin/AdminApp';
import AnalyticsApp from './apps/analytics/AnalyticsApp';
import SettingsApp from './apps/settings/SettingsApp';
import RoomBuilderApp from './apps/roomBuilder/RoomBuilderApp';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public routes  */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/booking" replace />} />
          <Route path="booking" element={<BookingApp />} />
          <Route path="mybooking" element={<MyBookings />} />
          <Route path="analytics" element={<AnalyticsApp />} />
          
          {/* Admin-only routes */}
          <Route path="admin" element={
            <ProtectedRoute requireAdmin>
              <AdminApp />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute requireAdmin>
              <SettingsApp />
            </ProtectedRoute>
          } />
          <Route path="room-builder" element={
            <ProtectedRoute requireAdmin>
              <RoomBuilderApp />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
