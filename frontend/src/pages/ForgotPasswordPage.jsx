import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForgotPassword } from '../hooks/useAuth';
import { Input } from '../components/ui';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mutate, isPending } = useForgotPassword({ onSuccess: () => setSubmitted(true) });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(email, { onSuccess: () => setSubmitted(true) });
  };

  return (
    <motion.div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink-100 mb-2">Quên mật khẩu</h1>
          <p className="text-ink-400">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-card p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-success-400" />
              </div>
              <h2 className="text-lg font-semibold text-ink-100 mb-2">Đã gửi email!</h2>
              <p className="text-ink-400 text-sm">
                Kiểm tra hộp thư của bạn và nhấn vào link đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-6 rounded-button font-semibold bg-primary-400 text-ink-950 hover:bg-primary-300 hover:shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : 'Gửi link đặt lại'}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;
