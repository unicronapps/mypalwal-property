const crypto = require('crypto');
const { query } = require('../config/db');
const axios = require('axios');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
const DUMMY_PHONE = process.env.DUMMY_PHONE || '9999999999';
const DUMMY_OTP = process.env.DUMMY_OTP || '123456';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendOtpViaMSG91(phone, otp) {
  if (phone === DUMMY_PHONE) return true;

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.log(`[DEV OTP] Phone: +91${phone}  OTP: ${otp}`);
    return true;
  }

  const normalizedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  try {
    await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      short_url: '0',
      realTimeResponse: '1',
      recipients: [{ mobiles: normalizedPhone, otp }],
    }, {
      headers: { authkey: authKey, 'Content-Type': 'application/json' },
    });
    return true;
  } catch (err) {
    console.error('MSG91 error:', err?.response?.data || err.message);
    return false;
  }
}

async function createAndSendOtp(phone, purpose) {
  const otp = phone === DUMMY_PHONE ? DUMMY_OTP : generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate old unused OTPs
  await query(
    `UPDATE otp_tokens SET used = true WHERE phone = $1 AND purpose = $2 AND used = false`,
    [phone, purpose]
  );

  await query(
    `INSERT INTO otp_tokens (phone, otp_hash, purpose, expires_at, used) VALUES ($1, $2, $3, $4, false)`,
    [phone, otpHash, purpose, expiresAt]
  );

  const sent = await sendOtpViaMSG91(phone, otp);
  if (!sent) return { success: false, message: 'Failed to send OTP via SMS' };
  return { success: true };
}

async function verifyOtp(phone, otp, purpose) {
  const otpHash = hashOtp(otp);

  const { rows } = await query(
    `SELECT id, expires_at, used FROM otp_tokens
     WHERE phone = $1 AND otp_hash = $2 AND purpose = $3 AND used = false
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otpHash, purpose]
  );

  if (!rows.length) return { valid: false, message: 'Invalid OTP' };

  const row = rows[0];
  if (new Date(row.expires_at) < new Date()) return { valid: false, message: 'OTP has expired' };

  await query(`UPDATE otp_tokens SET used = true WHERE id = $1`, [row.id]);
  return { valid: true };
}

async function checkOtpRateLimit(phone) {
  if (phone === DUMMY_PHONE) return true;
  const limit = parseInt(process.env.OTP_RATE_LIMIT || '3', 10);
  const { rows } = await query(
    `SELECT COUNT(*) as count FROM otp_tokens WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [phone]
  );
  return parseInt(rows[0].count, 10) < limit;
}

module.exports = { createAndSendOtp, verifyOtp, checkOtpRateLimit };
