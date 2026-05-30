import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLogin } from '../hooks/useAuth';
import { Input } from '../components/ui';
import { cn } from '../utils/helpers';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { mutate, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <motion.div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink-100 mb-2">Đăng nhập</h1>
          <p className="text-ink-400">Chào mừng bạn quay trở lại ScholarsGo</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
            <div>
              <Input
                label="Mật khẩu"
                icon={Lock}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs text-ink-500 hover:text-primary-400 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

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
              ) : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-ink-400 text-sm mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-400 font-semibold transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
