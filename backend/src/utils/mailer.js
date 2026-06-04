const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransport = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const sendResetEmail = async (email, resetLink) => {
  const transport = createTransport();
  if (!transport) {
    logger.info({ email, resetLink }, 'SMTP is not configured, logging password reset link');
    return;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || '"ScholarsGo" <no-reply@scholarsgo.com>',
    to: email,
    subject: 'Đặt lại mật khẩu ScholarsGo',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a1a;color:#fff;border-radius:16px;">
        <h2 style="margin:0 0 16px;font-size:24px;color:#a855f7;">ScholarsGo</h2>
        <p style="color:#ccc;line-height:1.6;">Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu.</p>
        <p style="color:#ccc;line-height:1.6;">Link có hiệu lực trong <strong style="color:#fff;">1 giờ</strong>.</p>
        <a href="${resetLink}"
           style="display:inline-block;margin:24px 0;padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#0e7490);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;">
          Đặt lại mật khẩu
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
      </div>
    `,
  });
};

module.exports = { sendResetEmail };
