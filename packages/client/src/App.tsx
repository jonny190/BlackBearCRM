import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/store';
import { theme } from './theme';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { AccountListPage } from './features/accounts/AccountListPage';
import { AccountDetailPage } from './features/accounts/AccountDetailPage';
import { DashboardRedirect } from './features/dashboard/DashboardRedirect';
import { ManagerDashboard } from './features/dashboard/ManagerDashboard';
import { TeamLeadDashboard } from './features/dashboard/TeamLeadDashboard';
import { OperationsDashboard } from './features/dashboard/OperationsDashboard';

// Lazy-loaded pages will be added as they are built
function PlaceholderPage({ title }: { title: string }) {
  return <div>{title} - Coming soon</div>;
}

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route path="/dashboard/manager" element={<ManagerDashboard />} />
                <Route path="/dashboard/team-lead" element={<TeamLeadDashboard />} />
                <Route path="/dashboard/operations" element={<OperationsDashboard />} />
                <Route path="/accounts" element={<AccountListPage />} />
                <Route path="/accounts/:id" element={<AccountDetailPage />} />
                <Route path="/alerts" element={<PlaceholderPage title="Alerts" />} />
                <Route path="/settings/*" element={<PlaceholderPage title="Settings" />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
