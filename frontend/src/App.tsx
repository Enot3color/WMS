import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { PermissionsProvider } from './auth/PermissionsContext';
import { AppLayout } from './components/AppLayout';
import { PermissionRoute } from './components/PermissionRoute';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ReferencesPage } from './pages/ReferencesPage';
import { SupplierOrderPage } from './pages/SupplierOrderPage';
import { UsersPage } from './pages/UsersPage';
import { WarehousePage } from './pages/WarehousePage';
import { SCREEN_CODES } from './types/permissions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ConfigProvider locale={ruRU}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionsProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.DASHBOARD} />}>
                      <Route path="/" element={<DashboardPage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.WAREHOUSE} />}>
                      <Route path="/warehouse" element={<WarehousePage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.MATERIALS} />}>
                      <Route path="/materials" element={<MaterialsPage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.ORDERS} />}>
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/orders/:id" element={<OrderDetailPage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.SUPPLIER_ORDERS} />}>
                      <Route path="/supplier-orders" element={<SupplierOrderPage />} />
                      <Route path="/supplier-orders/new" element={<SupplierOrderPage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.USERS} />}>
                      <Route path="/users" element={<UsersPage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.REFERENCES} />}>
                      <Route path="/references" element={<ReferencesPage />} />
                    </Route>
                    <Route element={<PermissionRoute screen={SCREEN_CODES.PERMISSIONS} />}>
                      <Route path="/permissions" element={<PermissionsPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </PermissionsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
}
