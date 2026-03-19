const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// TODO: [PHASE-4] Implement Razorpay payment routes
// POST /api/payments/order       - Create Razorpay order (boost/subscription)
// POST /api/payments/verify      - Verify payment signature
// GET  /api/payments/history     - Payment history for dealer

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'payments' } }));

module.exports = router;
