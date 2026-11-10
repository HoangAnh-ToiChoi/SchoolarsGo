import { useMutation } from '@tanstack/react-query';
import { authService } from '~/services/auth.service';
import { useDispatch } from 'react-redux';
import { loggedIn, loggedOut } from '~/store/slices/authSlice';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => authService.login(data),
    onSuccess: (response) => {
      const { user } = response.data.data;
      dispatch(loggedIn(user));
      toast.success(`Chào mừng ${user.full_name || user.email}!`);
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message || 'Đăng nhập thất bại');
    },
  });
};

export const useRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: (response) => {
      const { user } = response.data.data;
      dispatch(loggedIn(user));
      toast.success('Đăng ký thành công! Chào mừng bạn đến với ScholarsGo');
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message || 'Đăng ký thất bại');
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      dispatch(loggedOut());
      navigate('/');
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email) => authService.forgotPassword(email),
    onError: (error) => {
      toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    },
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password }) => authService.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Token không hợp lệ hoặc đã hết hạn');
    },
  });
};
