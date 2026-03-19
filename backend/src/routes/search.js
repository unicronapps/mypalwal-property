const express = require('express');
const router = express.Router();

// TODO: [PHASE-2] Implement search routes
// GET /api/search?q=...&city=...&type=...&minPrice=...&maxPrice=...
// Per SEARCH-001: if query is exactly 5-char alphanumeric, do direct property_id lookup first

router.get('/health', (req, res) => res.json({ success: true, data: { route: 'search' } }));

module.exports = router;
