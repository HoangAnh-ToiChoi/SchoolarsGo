import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResetPassword } from '../hooks/useAuth';
import { Input } from '../components/ui';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const { mutate, isPending } = useResetPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return;
    mutate({ token, password: form.password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ink-100 mb-2">Link không hợp lệ</h2>
          <p className="text-ink-400 mb-4">Token đặt lại mật khẩu không tìm thấy trong URL.</p>
          <Link to="/forgot-password" className="text-primary-400 hover:text-primary-400 font-medium">
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink-100 mb-2">Đặt mật khẩu mới</h1>
          <p className="text-ink-400">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Mật khẩu mới"
              icon={Lock}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
            <div>
              <Input
                label="Xác nhận mật khẩu"
                icon={Lock}
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Nhập lại mật khẩu"
                required
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="mt-1.5 text-xs text-danger-400">Mật khẩu không khớp</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isPending || (!!form.confirm && form.password !== form.confirm)}
              className="w-full py-3 px-6 rounded-button font-semibold bg-primary-400 text-ink-950 hover:bg-primary-300 hover:shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : 'Đặt lại mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPasswordPage;
