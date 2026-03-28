import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useRegister } from '../hooks/useAuth';
import LoadingButton from '../components/LoadingButton';

const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const { mutate, isPending } = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký</h1>
          <p className="text-gray-600">Tạo tài khoản miễn phí để bắt đầu</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nguyen Van A" required />
            </div>
          </div>
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
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Tối thiểu 8 ký tự" required minLength={8} />
            </div>
          </div>
          <LoadingButton type="submit" isLoading={isPending} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors">
            Tạo Tài Khoản
          </LoadingButton>
          <p className="text-center text-gray-600 text-sm">
            Đã có tài khoản? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
