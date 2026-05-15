import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useLogin } from '../hooks/useAuth';
import { Input } from '../components/ui';
import { AuroraBackground } from '../components/landing/AuroraBackground';
import { cn } from '../utils/helpers';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { mutate, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white flex items-center justify-center pt-20 pb-12 px-4">
      <AuroraBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-gray-200 dark:border-white/10 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <LogIn className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/70">
            Đăng Nhập
          </h1>
          <p className="text-gray-500 dark:text-white/60 text-lg font-light">
            Chào mừng bạn quay trở lại ScholarsGo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm dark:shadow-[0_0_40px_rgba(168,85,247,0.1)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none" />

          <div className="relative z-10 space-y-5">
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

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all duration-300",
                "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500",
                "shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex justify-center items-center gap-2 mt-4"
              )}
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng Nhập'
              )}
            </button>
          </div>

          <p className="text-center text-gray-500 dark:text-white/50 text-sm mt-8 relative z-10">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-bold transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
