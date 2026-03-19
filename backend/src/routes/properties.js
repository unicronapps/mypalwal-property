const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

// TODO: [PHASE-2] Implement property CRUD routes
// POST   /api/properties          - Create property (dealer/user)
// GET    /api/properties          - List/search properties (public)
// GET    /api/properties/:id      - Get single property (public)
// PUT    /api/properties/:id      - Update property (owner)
// DELETE /api/properties/:id      - Delete property (owner/admin)
// POST   /api/properties/:id/boost - Boost property (dealer) [PHASE-4]

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'properties' } }));

module.exports = router;
