const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { createAndSendOtp, verifyOtp, checkOtpRateLimit } = require('../services/otp');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, phone: user.phone, name: user.name },
    process.env.JWT_ACCESS_SECRET,
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET);
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    path: '/',
  });
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// POST /api/auth/otp/send
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required', code: 'VALIDATION_ERROR' });
  if (!validatePhone(phone)) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number', code: 'INVALID_PHONE' });

  const allowed = await checkOtpRateLimit(phone);
  if (!allowed) return res.status(429).json({ success: false, message: 'Too many OTPs sent. Try again after an hour.', code: 'OTP_RATE_LIMIT' });

  const { rows } = await query(
    `SELECT id, phone_verified, name FROM users WHERE phone = $1`,
    [phone]
  );

  const existing = rows[0];
  const isExistingUser = !!(existing && existing.phone_verified);

  if (!existing) {
    await query(
      `INSERT INTO users (phone, role, phone_verified, name) VALUES ($1, 'user', false, '') ON CONFLICT (phone) DO NOTHING`,
      [phone]
    );
  }

  const result = await createAndSendOtp(phone, 'login_or_register');
  if (!result.success) return res.status(500).json({ success: false, message: result.message || 'Failed to send OTP', code: 'OTP_SEND_FAILED' });

  return res.json({ success: true, data: { message: `OTP sent to +91 ${phone}`, isExistingUser } });
});

// POST /api/auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'phone and otp are required', code: 'VALIDATION_ERROR' });
  if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: 'OTP must be 6 digits', code: 'INVALID_OTP' });

  const result = await verifyOtp(phone, otp, 'login_or_register');
  if (!result.valid) return res.status(400).json({ success: false, message: result.message, code: 'OTP_INVALID' });

  const { rows } = await query(
    `UPDATE users SET phone_verified = true, last_login_at = NOW() WHERE phone = $1
     RETURNING id, name, role, phone, phone_verified`,
    [phone]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });

  const user = rows[0];
  const isNewUser = !user.name || user.name.trim() === '';

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    success: true,
    data: {
      accessToken,
      isNewUser,
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
    },
  });
});

// POST /api/auth/complete-profile
router.post('/complete-profile', verifyToken, async (req, res) => {
  const { name, role } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required', code: 'VALIDATION_ERROR' });
  if (!['user', 'dealer'].includes(role)) return res.status(400).json({ success: false, message: 'Role must be user or dealer', code: 'INVALID_ROLE' });

  const { rows } = await query(
    `UPDATE users SET name = $1, role = $2 WHERE id = $3 RETURNING id, name, role, phone`,
    [name.trim(), role, req.user.id]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });

  const user = rows[0];
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    success: true,
    data: { accessToken, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token not found', code: 'NO_REFRESH_TOKEN' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'REFRESH_TOKEN_INVALID' });
  }

  const { rows } = await query(
    `SELECT id, name, role, phone FROM users WHERE id = $1`,
    [decoded.sub]
  );

  if (!rows.length) return res.status(401).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });

  const user = rows[0];
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    success: true,
    data: { accessToken, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token', { path: '/' });
  return res.json({ success: true, data: { message: 'Logged out successfully' } });
});

module.exports = router;
