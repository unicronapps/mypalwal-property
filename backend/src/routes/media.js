const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: [PHASE-2] Implement media routes
// POST /api/media/presign   - Generate presigned PUT URL (MEDIA-001)
// POST /api/media/confirm   - Confirm upload and save to property_media table

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'media' } }));

module.exports = router;
