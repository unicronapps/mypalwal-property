const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { createAndSendOtp, verifyOtp, checkOtpRateLimit } = require('../services/otp');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, phone: user.phone, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// ─── POST /api/auth/otp/send ───────────────────────────────────────────────────
// Unified: works for both new and existing users.
// Returns { isExistingUser } so frontend knows whether to show "Welcome back" or "Create account"
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required', code: 'VALIDATION_ERROR' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number', code: 'INVALID_PHONE' });
  }

  const allowed = await checkOtpRateLimit(phone);
  if (!allowed) {
    return res.status(429).json({ success: false, message: 'Too many OTPs sent. Try again after an hour.', code: 'OTP_RATE_LIMIT' });
  }

  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, phone_verified, name')
    .eq('phone', phone)
    .maybeSingle();

  const isExistingUser = !!(existing && existing.phone_verified);
  const purpose = 'login_or_register';

  // Create placeholder user if doesn't exist
  if (!existing) {
    const { error } = await supabase.from('users').insert({
      phone,
      role: 'user', // default, can be changed in complete-profile
      phone_verified: false,
      name: '',
    });
    if (error && error.code !== '23505') { // ignore duplicate key
      return res.status(500).json({ success: false, message: 'Failed to initiate registration', code: 'DB_ERROR' });
    }
  }

  const result = await createAndSendOtp(phone, purpose);
  if (!result.success) {
    return res.status(500).json({ success: false, message: result.message || 'Failed to send OTP', code: 'OTP_SEND_FAILED' });
  }

  return res.json({
    success: true,
    data: {
      message: `OTP sent to +91 ${phone}`,
      isExistingUser,
    },
  });
});

// ─── POST /api/auth/otp/verify ─────────────────────────────────────────────────
router.post('/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'phone and otp are required', code: 'VALIDATION_ERROR' });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'OTP must be 6 digits', code: 'INVALID_OTP' });
  }

  const result = await verifyOtp(phone, otp, 'login_or_register');
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message, code: 'OTP_INVALID' });
  }

  // Get or update user
  const { data: user, error } = await supabase
    .from('users')
    .update({ phone_verified: true, last_login_at: new Date().toISOString() })
    .eq('phone', phone)
    .select('id, name, role, phone, phone_verified')
    .single();

  if (error || !user) {
    return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
  }

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

// ─── POST /api/auth/complete-profile ─────────────────────────────────────────
// Called after first OTP verify for new users to set name + role
router.post('/complete-profile', verifyToken, async (req, res) => {
  const { name, role } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required', code: 'VALIDATION_ERROR' });
  }
  if (!['user', 'dealer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be user or dealer', code: 'INVALID_ROLE' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({ name: name.trim(), role })
    .eq('id', req.user.id)
    .select('id, name, role, phone')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile', code: 'DB_ERROR' });
  }

  // Issue fresh token with updated name/role
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
    },
  });
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token not found', code: 'NO_REFRESH_TOKEN' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'REFRESH_TOKEN_INVALID' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, role, phone')
    .eq('id', decoded.sub)
    .single();

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  setRefreshCookie(res, newRefreshToken);

  return res.json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
    },
  });
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  return res.json({ success: true, data: { message: 'Logged out successfully' } });
});

module.exports = router;
