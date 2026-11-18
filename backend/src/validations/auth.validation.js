const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(255),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(128),
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
