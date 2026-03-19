const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: [PHASE-6] Implement notification routes
// GET   /api/notifications      - List user's notifications
// PATCH /api/notifications/read - Mark notifications as read
// POST  /api/notifications/device-token - Register FCM device token

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'notifications' } }));

module.exports = router;
