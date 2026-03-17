import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export function ProtectedRoute() {
  const token = useSelector((state: RootState) => state.auth.accessToken);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
