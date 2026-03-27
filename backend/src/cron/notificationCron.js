const cron = require('node-cron');
const { query } = require('../config/db');
const { sendNotification } = require('../services/notification');

/**
 * Daily cron jobs for notification triggers:
 * 1. boost_expired — boosts that have expired, notify owner + update status
 * 2. listing_expiring — boosts expiring within 3 days, warn owner
 */
function startNotificationCrons() {
  // Run every day at 8:00 AM IST (2:30 AM UTC)
  cron.schedule('30 2 * * *', async () => {
    console.log('[CRON] Running daily notification checks...');

    // 1. Expired boosts — set status=expired, is_boosted=false, notify owner
    try {
      const { rows: expired } = await query(`
        SELECT b.id, b.property_id, b.user_id, b.duration_days,
               p.title, p.property_id AS pid
        FROM boosts b
        JOIN properties p ON p.id = b.property_id
        WHERE b.status = 'active' AND b.expires_at <= NOW()
      `);

      for (const boost of expired) {
        try {
          await query(`UPDATE boosts SET status = 'expired' WHERE id = $1`, [boost.id]);
          await query(
            `UPDATE properties SET is_boosted = false, boost_expires_at = NULL WHERE id = $1`,
            [boost.property_id]
          );
          await sendNotification({
            userId: boost.user_id,
            type: 'boost_expired',
            title: 'Boost Expired',
            body: `Your boost for "${boost.title}" (${boost.pid}) has expired.`,
            data: { property_id: boost.property_id, boost_id: boost.id },
          });
        } catch (err) {
          console.error(`[CRON] Failed to process expired boost ${boost.id}:`, err.message);
        }
      }
      if (expired.length) console.log(`[CRON] Processed ${expired.length} expired boosts`);
    } catch (err) {
      console.error('[CRON] Expired boosts check failed:', err.message);
    }

    // 2. Boosts expiring in 3 days — warn owner (only if not already notified)
    try {
      const { rows: expiring } = await query(`
        SELECT b.id, b.property_id, b.user_id, b.expires_at,
               p.title, p.property_id AS pid
        FROM boosts b
        JOIN properties p ON p.id = b.property_id
        WHERE b.status = 'active'
          AND b.expires_at > NOW()
          AND b.expires_at <= NOW() + INTERVAL '3 days'
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = b.user_id
              AND n.type = 'listing_expiring'
              AND n.data->>'boost_id' = b.id::text
          )
      `);

      for (const boost of expiring) {
        try {
          const expiresDate = new Date(boost.expires_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          });
          await sendNotification({
            userId: boost.user_id,
            type: 'listing_expiring',
            title: 'Boost Expiring Soon',
            body: `Your boost for "${boost.title}" (${boost.pid}) expires on ${expiresDate}. Renew to stay visible.`,
            data: { property_id: boost.property_id, boost_id: boost.id },
          });
        } catch (err) {
          console.error(`[CRON] Failed to send expiring notification for boost ${boost.id}:`, err.message);
        }
      }
      if (expiring.length) console.log(`[CRON] Sent ${expiring.length} expiring boost warnings`);
    } catch (err) {
      console.error('[CRON] Expiring boosts check failed:', err.message);
    }

    console.log('[CRON] Daily notification checks complete');
  });

  console.log('[CRON] Notification cron jobs scheduled (daily at 8:00 AM IST)');
}

module.exports = { startNotificationCrons };
