const { query } = require('../config/db');
// Firebase Admin SDK for FCM push
// Initialize in production with GOOGLE_APPLICATION_CREDENTIALS env var
let firebaseAdmin = null;
try {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    // Only init if credentials are available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FCM_SERVICE_ACCOUNT) {
      const serviceAccount = process.env.FCM_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FCM_SERVICE_ACCOUNT)
        : undefined;
      admin.initializeApp(
        serviceAccount
          ? { credential: admin.credential.cert(serviceAccount) }
          : { credential: admin.credential.applicationDefault() }
      );
    }
  }
  if (admin.apps.length) firebaseAdmin = admin;
} catch (err) {
  console.warn('Firebase Admin SDK not available — FCM push disabled:', err.message);
}

/**
 * Creates a notification in DB and sends FCM push.
 * Per NOTIF-001: always write to DB first, then push.
 * Never fails the main request — FCM errors are caught.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.type - e.g. 'new_enquiry', 'listing_approved'
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.data] - extra payload
 */
async function sendNotification({ userId, type, title, body, data = {} }) {
  // Step 1: Write to DB (always)
  let notif;
  try {
    const { rows, rowCount } = await query(`
      INSERT INTO notifications (user_id, type, title, body, data, read)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `, [userId, type, title, body, JSON.stringify(data)]);

    if (!rowCount) {
      console.error('Failed to save notification');
      return { success: false };
    }
    notif = rows[0];
  } catch (err) {
    console.error('Notification DB insert error:', err.message);
    return { success: false };
  }

  // Step 2: Send FCM push to all active device tokens for user
  try {
    if (!firebaseAdmin) return { success: true, notificationId: notif.id };

    const { rows: tokens } = await query(
      `SELECT id, token, platform FROM device_tokens WHERE user_id = $1 AND active = true`,
      [userId]
    );

    if (!tokens.length) return { success: true, notificationId: notif.id };

    const messaging = firebaseAdmin.messaging();

    // Send to each token, handle invalid tokens
    const results = await Promise.allSettled(
      tokens.map(async (t) => {
        try {
          await messaging.send({
            token: t.token,
            notification: { title, body },
            data: {
              type,
              notification_id: notif.id,
              ...Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
              ),
            },
            ...(t.platform === 'web'
              ? { webpush: { fcmOptions: { link: '/' } } }
              : {}),
          });
          return { tokenId: t.id, success: true };
        } catch (fcmErr) {
          // If token is invalid/expired, delete it
          const invalidCodes = [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered',
          ];
          if (invalidCodes.includes(fcmErr.code)) {
            await query(`DELETE FROM device_tokens WHERE id = $1`, [t.id]);
            console.log(`Deleted invalid FCM token ${t.id}`);
          } else {
            console.error(`FCM send error for token ${t.id}:`, fcmErr.message);
          }
          return { tokenId: t.id, success: false };
        }
      })
    );

    return { success: true, notificationId: notif.id, fcmResults: results };
  } catch (err) {
    // Never fail main request if FCM fails
    console.error('FCM push error (non-fatal):', err.message);
    return { success: true, notificationId: notif.id };
  }
}

module.exports = { sendNotification };
