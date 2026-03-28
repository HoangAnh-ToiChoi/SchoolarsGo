import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useLogin } from '../hooks/useAuth';
import LoadingButton from '../components/LoadingButton';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { mutate, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
          <p className="text-gray-600">Chào mừng bạn quay trở lại ScholarsGo</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="your@email.com" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="••••••••" required />
            </div>
          </div>
          <LoadingButton type="submit" isLoading={isPending} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors">
            Đăng nhập
          </LoadingButton>
          <p className="text-center text-gray-600 text-sm">
            Chưa có tài khoản? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
