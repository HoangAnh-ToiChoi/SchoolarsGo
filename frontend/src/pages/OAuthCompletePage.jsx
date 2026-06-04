import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

const PROVIDER_LABELS = {
  facebook: 'Facebook',
  apple: 'Apple ID',
};

const OAuthCompletePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Đang hoàn tất đăng nhập mạng xã hội...');

  useEffect(() => {
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    authService.getMe()
      .then((response) => {
        const user = response.data.data;
        login(user);
        setStatus('success');
        setMessage(`Đăng nhập bằng ${PROVIDER_LABELS[provider] || 'OAuth'} thành công`);
        setTimeout(() => navigate('/'), 1200);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Không thể hoàn tất đăng nhập mạng xã hội');
      });
  }, [login, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-ink-800 bg-ink-900 p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary-400" />
            <h1 className="mb-2 text-2xl font-bold text-ink-100">Đang xác thực</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-success-400" />
            <h1 className="mb-2 text-2xl font-bold text-ink-100">Thành công</h1>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-danger-400" />
            <h1 className="mb-2 text-2xl font-bold text-ink-100">Đăng nhập thất bại</h1>
          </>
        )}

        <p className="text-sm leading-relaxed text-ink-400">{message}</p>

        {status === 'error' && (
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/login" className="btn-primary">
              Quay lại đăng nhập
            </Link>
            <Link to="/" className="text-sm font-medium text-ink-500 hover:text-ink-300 transition-colors">
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCompletePage;
