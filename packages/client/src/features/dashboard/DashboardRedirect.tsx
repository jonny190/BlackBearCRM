import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export function DashboardRedirect() {
  const user = useSelector((state: RootState) => state.auth.user);
  if (user?.role === 'admin') return <Navigate to="/dashboard/operations" replace />;
  if (user?.role === 'team_lead') return <Navigate to="/dashboard/team-lead" replace />;
  return <Navigate to="/dashboard/manager" replace />;
}
