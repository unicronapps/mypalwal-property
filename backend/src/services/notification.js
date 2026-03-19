const { query } = require('../config/db');
// TODO: [PHASE-6] Import Firebase Admin SDK for FCM push
// const admin = require('firebase-admin');

/**
 * Creates a notification in DB and sends FCM push.
 * Per NOTIF-001: always write to DB first, then push.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.type - e.g. 'enquiry_received', 'visit_scheduled'
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.data] - extra payload
 */
async function sendNotification({ userId, type, title, body, data = {} }) {
  // Step 1: Write to DB (always)
  const { rows, rowCount } = await query(`
    INSERT INTO notifications (user_id, type, title, body, data, read)
    VALUES ($1, $2, $3, $4, $5, false)
    RETURNING *
  `, [userId, type, title, body, JSON.stringify(data)]);

  if (!rowCount) {
    console.error('Failed to save notification');
    return { success: false };
  }

  const notif = rows[0];

  // Step 2: Send FCM push to all active device tokens for user
  // TODO: [PHASE-6] Implement FCM push
  // const { rows: tokens } = await query(
  //   `SELECT token, platform FROM device_tokens WHERE user_id = $1 AND active = true`,
  //   [userId]
  // );
  // await sendFcmToTokens(tokens, { title, body, data });

  return { success: true, notificationId: notif.id };
}

module.exports = { sendNotification };
