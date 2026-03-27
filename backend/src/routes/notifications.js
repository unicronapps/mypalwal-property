const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// All notification routes require auth
router.use(verifyToken);

// ─── GET /api/notifications ─── list user's notifications (paginated)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [countR, dataR] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1`, [req.user.id]),
      query(`
        SELECT id, type, title, body, data, read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [req.user.id, limit, offset]),
    ]);

    res.json({
      success: true,
      data: {
        notifications: dataR.rows,
        total: countR.rows[0].total,
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
});

// ─── GET /api/notifications/unread-count ─── badge count
router.get('/unread-count', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    res.json({ success: true, data: { unread_count: rows[0].count } });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

// ─── PATCH /api/notifications/:id/read ─── mark single as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: { id: rows[0].id } });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// ─── PATCH /api/notifications/read-all ─── mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    const { rowCount } = await query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    res.json({ success: true, data: { marked: rowCount } });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// ─── POST /api/notifications/device-token ─── register FCM token
router.post('/device-token', async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'token is required' });
    if (!['web', 'ios', 'android'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'platform must be web, ios, or android' });
    }

    // Upsert: if token exists for another user, reassign it
    await query(
      `INSERT INTO device_tokens (user_id, token, platform, active, last_seen_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (token) DO UPDATE SET
         user_id = $1, platform = $3, active = true, last_seen_at = NOW()`,
      [req.user.id, token, platform]
    );

    res.json({ success: true, data: { message: 'Device token registered' } });
  } catch (err) {
    console.error('Device token error:', err);
    res.status(500).json({ success: false, message: 'Failed to register device token' });
  }
});

module.exports = router;
