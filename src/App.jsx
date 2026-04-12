import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './layouts/Layout';
import Home from './pages/public/Home';

// Agen Pages
import AdminDashboard from './pages/agen/Dashboard';
import AdminOrders from './pages/agen/Pesanan';
import AdminDeliveries from './pages/agen/Deliveries';
import AdminPangkalan from './pages/agen/Pangkalan';
import AdminStock from './pages/agen/Stock';
import AdminReports from './pages/agen/Reports';
import AdminRoutePlanner from './pages/agen/RoutePlanner';
import AdminSales from './pages/agen/DataPenjualan';

// Pangkalan Pages
import UserDashboard from './pages/pangkalan/Dashboard';
import UserSales from './pages/pangkalan/Penjualan';
import UserNewOrder from './pages/pangkalan/NewOrder';
import UserHistory from './pages/pangkalan/History';

import './index.css';
import './styles/components.css';
import './styles/public.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat Sistem...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;

  return children;
};

const RootRoute = () => {
  const { user, role, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Sinkronisasi Sistem...</div>;
  if (!user) return <Home />; // Default public home if not logged in
  if (role === 'agen') return <Navigate to="/admin" />;
  if (role === 'pangkalan') return <Navigate to="/user" />;
  return <Home />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/pesanan" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminOrders />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/pengiriman" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminDeliveries />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/pangkalan" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminPangkalan />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/stok" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminStock />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/laporan" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminReports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/planner" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminRoutePlanner />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/penjualan" element={
            <ProtectedRoute allowedRoles={['agen']}>
              <Layout>
                <AdminSales />
              </Layout>
            </ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={['pangkalan']}>
              <Layout>
                <UserDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/penjualan" element={
            <ProtectedRoute allowedRoles={['pangkalan']}>
              <Layout>
                <UserSales />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/pesan" element={
            <ProtectedRoute allowedRoles={['pangkalan']}>
              <Layout>
                <UserNewOrder />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/riwayat" element={
            <ProtectedRoute allowedRoles={['pangkalan']}>
              <Layout>
                <UserHistory />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
