const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: [PHASE-3] Implement enquiry routes
// POST /api/enquiries         - Submit enquiry (buyer, requires login)
// GET  /api/enquiries         - List enquiries for my properties (dealer)
// PATCH /api/enquiries/:id/status - Mark enquiry handled

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'enquiries' } }));

module.exports = router;
