const crypto = require('crypto');
const supabase = require('../config/supabase');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

// DUMMY: Always works in dev without MSG91 credentials
const DUMMY_PHONE = process.env.DUMMY_PHONE || '9999999999';
const DUMMY_OTP = process.env.DUMMY_OTP || '123456';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendOtpViaMSG91(phone, otp) {
  // Dummy phone: skip real SMS
  if (phone === DUMMY_PHONE) return true;

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    // No MSG91 key — log OTP to console for dev testing
    console.log(`[DEV OTP] Phone: ${phone} OTP: ${otp}`);
    return true;
  }

  const normalizedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  try {
    const axios = require('axios');
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
  // Dummy phone: use fixed OTP
  const otp = phone === DUMMY_PHONE ? DUMMY_OTP : generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Invalidate old unused OTPs for this phone+purpose
  await supabase
    .from('otp_tokens')
    .update({ used: true })
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('used', false);

  const { error } = await supabase.from('otp_tokens').insert({
    phone,
    otp_hash: otpHash,
    purpose,
    expires_at: expiresAt,
    used: false,
  });

  if (error) {
    console.error('Failed to save OTP:', error);
    return { success: false, message: 'Failed to create OTP' };
  }

  const sent = await sendOtpViaMSG91(phone, otp);
  if (!sent) {
    return { success: false, message: 'Failed to send OTP via SMS' };
  }

  return { success: true };
}

async function verifyOtp(phone, otp, purpose) {
  const otpHash = hashOtp(otp);

  const { data, error } = await supabase
    .from('otp_tokens')
    .select('id, expires_at, used')
    .eq('phone', phone)
    .eq('otp_hash', otpHash)
    .eq('purpose', purpose)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { valid: false, message: 'Invalid OTP' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'OTP has expired' };
  }

  await supabase.from('otp_tokens').update({ used: true }).eq('id', data.id);
  return { valid: true };
}

async function checkOtpRateLimit(phone) {
  // Dummy phone: always allow
  if (phone === DUMMY_PHONE) return true;
  const limit = parseInt(process.env.OTP_RATE_LIMIT || '3', 10);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('otp_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo);
  if (error) return true;
  return count < limit;
}

module.exports = { createAndSendOtp, verifyOtp, checkOtpRateLimit };
