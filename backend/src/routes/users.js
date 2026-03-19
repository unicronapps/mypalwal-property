const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: [PHASE-3] Implement user routes
// GET  /api/users/me          - Get own profile
// PUT  /api/users/me          - Update profile
// GET  /api/users/:id/public  - Public dealer profile [PHASE-4]

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'users' } }));

module.exports = router;
