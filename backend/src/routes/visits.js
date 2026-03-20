const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/visits/mine — distinct properties I visited, latest visit per property
router.get("/mine", verifyToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const countRes = await query(
    `SELECT COUNT(DISTINCT property_id) FROM property_views WHERE user_id = $1`,
    [req.user.id]
  );

  const { rows } = await query(
    `SELECT DISTINCT ON (pv.property_id)
            pv.property_id, pv.viewed_at,
            p.property_id as pid, p.title, p.property_type, p.category,
            p.price, p.price_unit, p.area_sqft, p.area_display_value, p.area_display_unit,
            p.status, p.is_verified,
            pl.city, pl.locality,
            (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
     FROM property_views pv
     JOIN properties p ON p.id = pv.property_id
     LEFT JOIN property_locations pl ON pl.property_id = p.id
     WHERE pv.user_id = $1
     ORDER BY pv.property_id, pv.viewed_at DESC`,
    [req.user.id]
  );

  // Sort by latest visit and paginate in app (DISTINCT ON requires ordering by property_id first)
  const sorted = rows.sort(
    (a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
  );
  const paginated = sorted.slice(offset, offset + limitNum);

  return res.json({
    success: true,
    data: {
      visits: paginated,
      total: parseInt(countRes.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    },
  });
});

// GET /api/visits/property/:id — daily counts for chart (owner only)
router.get("/property/:id", verifyToken, async (req, res) => {
  // Check ownership
  const { rows: propRows } = await query(
    `SELECT owner_id FROM properties WHERE id = $1`,
    [req.params.id]
  );
  if (!propRows.length)
    return res
      .status(404)
      .json({ success: false, message: "Property not found", code: "NOT_FOUND" });
  if (propRows[0].owner_id !== req.user.id && req.user.role !== "admin")
    return res
      .status(403)
      .json({ success: false, message: "Not authorized", code: "FORBIDDEN" });

  const { days = 30 } = req.query;
  const dayCount = Math.min(90, Math.max(1, parseInt(days, 10)));

  const { rows } = await query(
    `SELECT DATE(viewed_at) as date, COUNT(*) as views
     FROM property_views
     WHERE property_id = $1 AND viewed_at > NOW() - INTERVAL '1 day' * $2
     GROUP BY DATE(viewed_at)
     ORDER BY date ASC`,
    [req.params.id, dayCount]
  );

  return res.json({
    success: true,
    data: { daily_views: rows, property_id: req.params.id },
  });
});

// GET /api/visits/dealer/summary — across all dealer's listings
router.get("/dealer/summary", verifyToken, async (req, res) => {
  // Total views across all listings
  const { rows: totalRow } = await query(
    `SELECT COALESCE(SUM(p.view_count), 0) as total_views
     FROM properties p WHERE p.owner_id = $1`,
    [req.user.id]
  );

  // Top listing by views
  const { rows: topListing } = await query(
    `SELECT p.id, p.property_id, p.title, p.view_count,
            pl.city, pl.locality,
            (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
     FROM properties p
     LEFT JOIN property_locations pl ON pl.property_id = p.id
     WHERE p.owner_id = $1 AND p.status = 'active'
     ORDER BY p.view_count DESC
     LIMIT 1`,
    [req.user.id]
  );

  // Views in last 7 days
  const { rows: recentRow } = await query(
    `SELECT COUNT(*) as recent_views
     FROM property_views pv
     JOIN properties p ON p.id = pv.property_id
     WHERE p.owner_id = $1 AND pv.viewed_at > NOW() - INTERVAL '7 days'`,
    [req.user.id]
  );

  return res.json({
    success: true,
    data: {
      total_views: parseInt(totalRow[0].total_views, 10),
      recent_views_7d: parseInt(recentRow[0].recent_views, 10),
      top_listing: topListing[0] || null,
    },
  });
});

module.exports = router;
