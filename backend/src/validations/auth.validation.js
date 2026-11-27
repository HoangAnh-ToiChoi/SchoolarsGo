import { z } from 'zod';

// Email so khớp không phân biệt hoa thường: "An@Mail.com" và "an@mail.com" là một tài khoản (R16).
// Chuẩn hóa ngay ở đầu vào nên model, DB và token đặt lại mật khẩu chỉ thấy chữ thường.
const emailSchema = z.string().trim().toLowerCase().email('Email không hợp lệ').max(255);

const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(128),
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(255),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(128),
});

export { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };