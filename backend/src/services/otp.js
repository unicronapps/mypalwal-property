const crypto = require("crypto");
const { query } = require("../config/db");
const axios = require("axios");

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
const DUMMY_OTP = process.env.DUMMY_OTP || "123456";

// Any phone matching 999999999X (0-9) is a dummy test account
function isDummyPhone(phone) {
  return /^999999999\d$/.test(phone);
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

async function sendOtpViaWhatsApp(phone, otp) {
  if (isDummyPhone(phone)) return true;

  const token = process.env.WHATSAPP_TOKEN;
  const apiUrl =
    process.env.WHATSAPP_API ||
    "https://graph.facebook.com/v18.0/712383775290163/messages";

  if (!token) {
    console.log(`[DEV OTP] Phone: +91${phone}  OTP: ${otp}`);
    return true;
  }

  try {
    await axios.post(
      apiUrl,
      {
        messaging_product: "whatsapp",
        to: `91${phone}`,
        type: "template",
        template: {
          name: "otp",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: otp },
                { type: "text", text: "MyPalwal_Prop" },
                { type: "text", text: `${OTP_EXPIRY_MINUTES} minutes` },
                {
                  type: "text",
                  text: process.env.SUPPORT_PHONE || "9999999999",
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: otp }],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return true;
  } catch (err) {
    console.error("WhatsApp OTP error:", err?.response?.data || err.message);
    return false;
  }
}

async function createAndSendOtp(phone, purpose) {
  const otp = isDummyPhone(phone) ? DUMMY_OTP : generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate old unused OTPs
  await query(
    `UPDATE otp_tokens SET used = true WHERE phone = $1 AND purpose = $2 AND used = false`,
    [phone, purpose],
  );

  await query(
    `INSERT INTO otp_tokens (phone, otp_hash, purpose, expires_at, used) VALUES ($1, $2, $3, $4, false)`,
    [phone, otpHash, purpose, expiresAt],
  );

  const sent = await sendOtpViaWhatsApp(phone, otp);
  if (!sent) return { success: false, message: "Failed to send OTP via SMS" };
  return { success: true };
}

async function verifyOtp(phone, otp, purpose) {
  const otpHash = hashOtp(otp);

  const { rows } = await query(
    `SELECT id, expires_at, used FROM otp_tokens
     WHERE phone = $1 AND otp_hash = $2 AND purpose = $3 AND used = false
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otpHash, purpose],
  );

  if (!rows.length) return { valid: false, message: "Invalid OTP" };

  const row = rows[0];
  if (new Date(row.expires_at) < new Date())
    return { valid: false, message: "OTP has expired" };

  await query(`UPDATE otp_tokens SET used = true WHERE id = $1`, [row.id]);
  return { valid: true };
}

async function checkOtpRateLimit(phone) {
  if (isDummyPhone(phone)) return true;
  const limit = parseInt(process.env.OTP_RATE_LIMIT || "3", 10);
  const { rows } = await query(
    `SELECT COUNT(*) as count FROM otp_tokens WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [phone],
  );
  return parseInt(rows[0].count, 10) < limit;
}

module.exports = { createAndSendOtp, verifyOtp, checkOtpRateLimit };
