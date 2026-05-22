import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRegister } from '../hooks/useAuth';
import { Input } from '../components/ui';
import { cn } from '../utils/helpers';

const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const { mutate, isPending } = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <motion.div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink-100 mb-2">Tạo tài khoản</h1>
          <p className="text-ink-400">Miễn phí, không giới hạn</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full py-3 px-6 rounded-button font-semibold transition-colors mt-2',
                'bg-primary-400 text-ink-950 hover:bg-primary-300 hover:shadow-glow',
                'disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2'
              )}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-ink-400 text-sm mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-400 font-semibold transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
