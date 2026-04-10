const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../utils/db');

const SALT_ROUNDS = 12;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'scholarsgo-dev-secret-fallback-32chars',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (email, password, fullName) => {
  const existing = await queryOne(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing) {
    const err = new Error('Email đã được sử dụng');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await queryOne(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, avatar_url, phone, date_of_birth, created_at`,
    [email, passwordHash, fullName]
  );

  if (!user) {
    const err = new Error('Không thể tạo user');
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }

  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, full_name: user.full_name },
    token,
  };
};

const login = async (email, password) => {
  const user = await queryOne(
    'SELECT id, email, password_hash, full_name, avatar_url, phone, date_of_birth FROM users WHERE email = $1',
    [email]
  );

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

  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, full_name: user.full_name },
    token,
  };
};

const getMe = async (userId) => {
  const user = await queryOne(
    'SELECT id, email, full_name, avatar_url, phone, date_of_birth, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    const err = new Error('Không tìm thấy user');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  return user;
};

const refreshToken = async (userId) => {
  const user = await queryOne(
    'SELECT id, email FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    const err = new Error('Không tìm thấy user');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  return generateToken(user);
};

module.exports = { register, login, getMe, refreshToken };
