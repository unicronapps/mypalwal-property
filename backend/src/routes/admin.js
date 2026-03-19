const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

// TODO: [PHASE-5] Implement admin routes
// GET    /api/admin/users         - List all users
// PATCH  /api/admin/users/:id     - Update user role/status
// GET    /api/admin/properties    - List all properties
// PATCH  /api/admin/properties/:id/approve - Approve/reject listing
// GET    /api/admin/dashboard     - Stats overview

router.use(verifyToken, requireRole('admin'));
router.get('/health', (req, res) => res.json({ success: true, data: { route: 'admin' } }));

module.exports = router;
