import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useLogin } from '../hooks/useAuth';
import { Input, Button } from '../components/ui';

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
          <h1 className="text-heading-1 text-gray-900 mb-2">Đăng nhập</h1>
          <p className="text-body text-gray-600">Chào mừng bạn quay trở lại ScholarsGo</p>
        </div>
        <form onSubmit={handleSubmit} className="card card-body space-y-5">
          <Input
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            required
          />
          <Input
            label="Mật khẩu"
            icon={Lock}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
          <Button type="submit" isLoading={isPending} className="w-full" size="lg">
            Đăng nhập
          </Button>
          <p className="text-center text-gray-600 text-body-sm">
            Chưa có tài khoản? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
