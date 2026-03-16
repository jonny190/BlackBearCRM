import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/store';
import { theme } from './theme';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';

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
                <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
                <Route path="/accounts" element={<PlaceholderPage title="Accounts" />} />
                <Route path="/accounts/:id" element={<PlaceholderPage title="Account Detail" />} />
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
