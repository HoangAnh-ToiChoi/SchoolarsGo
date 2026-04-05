import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useRegister } from '../hooks/useAuth';
import { Input, Button } from '../components/ui';

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
          <h1 className="text-heading-1 text-gray-900 mb-2">Đăng ký</h1>
          <p className="text-body text-gray-600">Tạo tài khoản miễn phí để bắt đầu</p>
        </div>
        <form onSubmit={handleSubmit} className="card card-body space-y-5">
          <Input
            label="Họ và tên"
            icon={User}
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nguyen Van A"
            required
          />
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
            placeholder="Tối thiểu 6 ký tự"
            required
            minLength={6}
          />
          <Button type="submit" isLoading={isPending} className="w-full" size="lg">
            Tạo Tài Khoản
          </Button>
          <p className="text-center text-gray-600 text-body-sm">
            Đã có tài khoản? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
