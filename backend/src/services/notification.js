const supabase = require('../config/supabase');
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
  const { data: notif, error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    data,
    read: false,
  }).select().single();

  if (error) {
    console.error('Failed to save notification:', error);
    return { success: false };
  }

  // Step 2: Send FCM push to all active device tokens for user
  // TODO: [PHASE-6] Implement FCM push
  // const { data: tokens } = await supabase
  //   .from('device_tokens')
  //   .select('token, platform')
  //   .eq('user_id', userId)
  //   .eq('active', true);
  // await sendFcmToTokens(tokens, { title, body, data });

  return { success: true, notificationId: notif.id };
}

module.exports = { sendNotification };
