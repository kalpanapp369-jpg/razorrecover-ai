import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';

// Public Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RecoveryQueue } from './pages/admin/RecoveryQueue';
import { Cases } from './pages/admin/Cases';
import { Customers } from './pages/admin/Customers';
import { Payments } from './pages/admin/Payments';
import { Subscriptions } from './pages/admin/Subscriptions';
import { Invoices } from './pages/admin/Invoices';
import { Simulation } from './pages/admin/Simulation';
import { Analytics } from './pages/admin/Analytics';
import { Copilot } from './pages/admin/Copilot';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Policies } from './pages/admin/Policies';
import { Settings } from './pages/admin/Settings';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerPayments } from './pages/customer/CustomerPayments';
import { CustomerSubscriptions } from './pages/customer/CustomerSubscriptions';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';
import { CustomerRecovery } from './pages/customer/CustomerRecovery';
import { CustomerProfile } from './pages/customer/CustomerProfile';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="recovery-queue" element={<RecoveryQueue />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:id" element={<Cases />} />
            <Route path="customers" element={<Customers />} />
            <Route path="payments" element={<Payments />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="simulation" element={<Simulation />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="copilot" element={<Copilot />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="policies" element={<Policies />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Customer Protected Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="subscriptions" element={<CustomerSubscriptions />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="recovery" element={<CustomerRecovery />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
