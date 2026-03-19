const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: [PHASE-3] Implement visit scheduling routes
// POST  /api/visits           - Request site visit
// GET   /api/visits           - List visits (for dealer or buyer)
// PATCH /api/visits/:id       - Update visit status (confirm/cancel)

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'visits' } }));

module.exports = router;
