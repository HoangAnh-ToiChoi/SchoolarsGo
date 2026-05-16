const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getSupabase = require('../utils/supabase');

const SALT_ROUNDS = 12;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'scholarsgo-dev-secret-fallback-32chars',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (email, password, fullName) => {
  const sb = getSupabase();

  const { data: existing } = await sb.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    const err = new Error('Email đã được sử dụng');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await sb.from('users')
    .insert({ email, password_hash: passwordHash, full_name: fullName })
    .select('id, email, full_name, avatar_url, phone, date_of_birth, created_at')
    .single();

  if (error || !user) {
    const err = new Error('Không thể tạo user');
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  return { user: { id: user.id, email: user.email, full_name: user.full_name }, token: generateToken(user) };
};

const login = async (email, password) => {
  const sb = getSupabase();

  const { data: user } = await sb.from('users')
    .select('id, email, password_hash, full_name, avatar_url, phone, date_of_birth')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  return { user: { id: user.id, email: user.email, full_name: user.full_name }, token: generateToken(user) };
};

const getMe = async (userId) => {
  const { data: user } = await getSupabase().from('users')
    .select('id, email, full_name, avatar_url, phone, date_of_birth, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!user) {
    const err = new Error('Không tìm thấy user');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }
  return user;
};

const refreshToken = async (userId) => {
  const { data: user } = await getSupabase().from('users').select('id, email').eq('id', userId).maybeSingle();
  if (!user) {
    const err = new Error('Không tìm thấy user');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }
  return generateToken(user);
};

module.exports = { register, login, getMe, refreshToken };
