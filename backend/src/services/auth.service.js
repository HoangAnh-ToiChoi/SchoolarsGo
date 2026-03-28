const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabase');

const SALT_ROUNDS = 12;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (email, password, fullName) => {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    const err = new Error('Email đã được sử dụng');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
  });

  if (error) throw error;

  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, full_name: user.user_metadata.full_name },
    token,
  };
};

const login = async (email, password) => {
  const { data: user, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, full_name: user.user_metadata.full_name },
    token,
  };
};

const getMe = async (userId) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    const err = new Error('Không tìm thấy user');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    date_of_birth: user.date_of_birth,
    created_at: user.created_at,
  };
};

const refreshToken = async (userId) => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .single();

  if (!user) {
    const err = new Error('Không tìm thấy user');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  return generateToken(user);
};

module.exports = { register, login, getMe, refreshToken };
