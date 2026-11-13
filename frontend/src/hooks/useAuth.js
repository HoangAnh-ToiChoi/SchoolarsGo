import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '~/services/auth.service';
import { useDispatch } from 'react-redux';
import { loggedIn, loggedOut, sessionLoading } from '~/store/slices/authSlice';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

const getRedirect = search => {
  const requested = new URLSearchParams(search).get('redirect');
  return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/';
};

export const useSessionBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!localStorage.getItem('scholarsgo.session')) return;
    let active = true;
    authService.getMe()
      .then(response => { if (active) dispatch(loggedIn(response.data.data)); })
      .catch(() => { if (active) dispatch(loggedOut()); })
      .finally(() => { if (active) dispatch(sessionLoading(false)); });
    return () => { active = false; };
  }, [dispatch]);
};

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: data => authService.login(data),
    onSuccess: response => {
      const { user } = response.data.data;
      dispatch(loggedIn(user));
      toast.success(`Chào mừng ${user.full_name}!`);
      navigate(getRedirect(location.search), { replace: true });
    },
    onError: error => toast.error(error.message || 'Đăng nhập thất bại'),
  });
};

export const useRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: data => authService.register(data),
    onSuccess: response => {
      const { user } = response.data.data;
      dispatch(loggedIn(user));
      toast.success('Đăng ký thành công! Chào mừng bạn đến với ScholarsGo');
      navigate('/');
    },
    onError: error => toast.error(error.message || 'Đăng ký thất bại'),
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => { dispatch(loggedOut()); navigate('/'); },
  });
};

export const useAccount = options => useQuery({ queryKey: ['auth', 'account'], queryFn: () => authService.getAccount().then(response => response.data.data), ...options });
export const useSessions = options => useQuery({ queryKey: ['auth', 'sessions'], queryFn: () => authService.getSessions().then(response => response.data.data), ...options });

export const useEndSession = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: id => authService.endSession(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] }) });
};

export const useForgotPassword = () => useMutation({
  mutationFn: email => authService.forgotPassword(email),
  onError: error => toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại'),
});

export const useResetPassword = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ token, password }) => authService.resetPassword(token, password),
    onSuccess: () => { toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.'); navigate('/login'); },
    onError: error => toast.error(error.message || 'Token không hợp lệ hoặc đã hết hạn'),
  });
};
