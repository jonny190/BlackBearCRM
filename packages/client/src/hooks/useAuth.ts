import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { setCredentials, clearCredentials } from '../store/slices/authSlice';
import { useLoginMutation, useLogoutMutation } from '../store/api/authApi';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (email: string, password: string) => {
    const result = await loginMutation({ email, password }).unwrap();
    dispatch(setCredentials({ accessToken: result.data.accessToken, user: result.data.user }));
    navigate('/dashboard');
  };

  const logout = async () => {
    await logoutMutation().unwrap().catch(() => {});
    dispatch(clearCredentials());
    navigate('/login');
  };

  return { user, isAuthenticated: !!accessToken, isLoggingIn, login, logout };
}
