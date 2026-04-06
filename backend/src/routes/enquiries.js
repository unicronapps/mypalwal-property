const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// Optional auth middleware — attaches req.user if valid token present, else continues as guest
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  const jwt = require("jsonwebtoken");
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub, role: decoded.role, phone: decoded.phone };
  } catch (_) {
    // invalid/expired token — treat as guest
  }
  next();
}

// POST /api/enquiries — submit enquiry (logged-in or guest)
router.post("/", optionalAuth, async (req, res) => {
  const { property_id, message, guest_name, guest_phone } = req.body;

  if (!property_id)
    return res.status(400).json({
      success: false,
      message: "property_id is required",
      code: "VALIDATION_ERROR",
    });

  // Guest must provide name + phone
  if (!req.user) {
    if (!guest_name || !guest_name.trim())
      return res.status(400).json({
        success: false,
        message: "Name is required",
        code: "VALIDATION_ERROR",
      });
    const phoneRe = /^[6-9]\d{9}$/;
    if (!guest_phone || !phoneRe.test(guest_phone.trim()))
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
        code: "VALIDATION_ERROR",
      });
  }

  // Capture buyer IP (works behind proxies when trust proxy is enabled)
  const buyerIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;

  // Get property + owner
  const { rows: propRows } = await query(
    `SELECT p.id, p.property_id, p.title, p.owner_id, p.contact_enquiry,
            u.phone as owner_phone, u.name as owner_name
     FROM properties p
     JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1 AND p.status = 'active'`,
    [property_id],
  );
  if (!propRows.length)
    return res.status(404).json({
      success: false,
      message: "Property not found",
      code: "NOT_FOUND",
    });

  const property = propRows[0];

  if (!property.contact_enquiry)
    return res.status(400).json({
      success: false,
      message: "Enquiries not enabled for this listing",
      code: "ENQUIRY_DISABLED",
    });

  // Can't enquire on own property (logged-in only check)
  if (req.user && property.owner_id === req.user.id)
    return res.status(400).json({
      success: false,
      message: "Cannot enquire on your own property",
      code: "SELF_ENQUIRY",
    });

  let buyerName, buyerPhone, buyerId;

  if (req.user) {
    // Logged-in: fetch name + phone from DB
    const { rows: buyerRows } = await query(
      `SELECT name, phone FROM users WHERE id = $1`,
      [req.user.id],
    );
    buyerName = buyerRows[0].name;
    buyerPhone = buyerRows[0].phone;
    buyerId = req.user.id;

    // Rate limit: 2 per user per property per 24h
    const { rows: recent } = await query(
      `SELECT COUNT(*) FROM enquiries
       WHERE buyer_id = $1 AND property_id = $2
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [buyerId, property_id],
    );
    if (parseInt(recent[0].count, 10) >= 2)
      return res.status(429).json({
        success: false,
        message: "Max 2 enquiries per property per 24 hours",
        code: "RATE_LIMIT",
      });
  } else {
    buyerName = guest_name.trim();
    buyerPhone = guest_phone.trim();
    buyerId = null;

    // Rate limit guests by phone: 2 per phone per property per 24h
    const { rows: recent } = await query(
      `SELECT COUNT(*) FROM enquiries
       WHERE buyer_phone = $1 AND property_id = $2
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [buyerPhone, property_id],
    );
    if (parseInt(recent[0].count, 10) >= 2)
      return res.status(429).json({
        success: false,
        message: "Max 2 enquiries per property per 24 hours",
        code: "RATE_LIMIT",
      });
  }

  // Insert enquiry
  const { rows: enquiry } = await query(
    `INSERT INTO enquiries (property_id, buyer_id, owner_id, buyer_name, buyer_phone, message, buyer_ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [property_id, buyerId, property.owner_id, buyerName, buyerPhone, message || null, buyerIp],
  );

  // WhatsApp message to poster (wa.me link logged for now)
  if (property.owner_phone) {
    const waMessage = encodeURIComponent(
      `New enquiry on your property "${property.title}" (ID: ${property.property_id})\n` +
        `From: ${buyerName || "N/A"}, ${buyerPhone}\n` +
        `Message: ${message || "No message"}`,
    );
    const waUrl = `https://wa.me/91${property.owner_phone}?text=${waMessage}`;
    console.log("[WhatsApp] Enquiry notification:", waUrl);
  }

  return res.status(201).json({
    success: true,
    data: { id: enquiry[0].id, message: "Enquiry sent successfully" },
  });
});

// GET /api/enquiries/received — property owner's received enquiries
router.get("/received", verifyToken, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [`e.owner_id = $1`];
  const params = [req.user.id];

  if (status) {
    conditions.push(`e.status = $${params.length + 1}`);
    params.push(status);
  }

  const countRes = await query(
    `SELECT COUNT(*) FROM enquiries e WHERE ${conditions.join(" AND ")}`,
    params,
  );

  params.push(limitNum, offset);
  const { rows } = await query(
    `SELECT e.id, e.buyer_name, e.buyer_phone, e.message, e.status,
            e.created_at, e.updated_at,
            p.id as property_id, p.property_id as pid, p.title as property_title,
            (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as property_thumbnail
     FROM enquiries e
     JOIN properties p ON p.id = e.property_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY e.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return res.json({
    success: true,
    data: {
      enquiries: rows,
      total: parseInt(countRes.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    },
  });
});

// GET /api/enquiries/sent — buyer's sent enquiries
router.get("/sent", verifyToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const countRes = await query(
    `SELECT COUNT(*) FROM enquiries WHERE buyer_id = $1`,
    [req.user.id],
  );

  const { rows } = await query(
    `SELECT e.id, e.message, e.status, e.created_at,
            p.id as property_id, p.property_id as pid, p.title as property_title,
            p.price, p.price_unit,
            (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as property_thumbnail,
            pl.city, pl.locality
     FROM enquiries e
     JOIN properties p ON p.id = e.property_id
     LEFT JOIN property_locations pl ON pl.property_id = p.id
     WHERE e.buyer_id = $1
     ORDER BY e.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limitNum, offset],
  );

  return res.json({
    success: true,
    data: {
      enquiries: rows,
      total: parseInt(countRes.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    },
  });
});

// PATCH /api/enquiries/:id/status — owner of property only
router.patch("/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  if (!status || !["new", "replied", "closed"].includes(status))
    return res.status(400).json({
      success: false,
      message: "status must be new, replied, or closed",
      code: "VALIDATION_ERROR",
    });

  const { rows } = await query(
    `SELECT id, owner_id FROM enquiries WHERE id = $1`,
    [req.params.id],
  );
  if (!rows.length)
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
      code: "NOT_FOUND",
    });
  if (rows[0].owner_id !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({
      success: false,
      message: "Not authorized",
      code: "FORBIDDEN",
    });

  await query(`UPDATE enquiries SET status = $1 WHERE id = $2`, [
    status,
    req.params.id,
  ]);

  // Send notification to buyer when owner replies
  if (status === "replied") {
    try {
      const { rows: enqRows } = await query(
        `SELECT e.buyer_id, e.property_id, p.title, p.property_id AS pid
         FROM enquiries e JOIN properties p ON p.id = e.property_id
         WHERE e.id = $1`,
        [req.params.id],
      );
    } catch (err) {
      console.error("Enquiry replied notification error:", err.message);
    }
  }

  return res.json({
    success: true,
    data: { message: "Status updated" },
  });
});

// GET /api/enquiries/contact/:propertyId — contact info for a property
router.get("/contact/:propertyId", verifyToken, async (req, res) => {
  const { rows } = await query(
    `SELECT p.contact_call, p.contact_whatsapp, p.contact_enquiry,
            u.phone, u.name
     FROM properties p
     JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [req.params.propertyId],
  );

  if (!rows.length)
    return res.status(404).json({
      success: false,
      message: "Property not found",
      code: "NOT_FOUND",
    });

  const prop = rows[0];

  // Check if user already sent max enquiries
  const { rows: recent } = await query(
    `SELECT COUNT(*) FROM enquiries
     WHERE buyer_id = $1 AND property_id = $2
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [req.user.id, req.params.propertyId],
  );
  const canEnquire = prop.contact_enquiry && parseInt(recent[0].count, 10) < 2;

  return res.json({
    success: true,
    data: {
      phone: prop.contact_call ? prop.phone : null,
      whatsapp: prop.contact_whatsapp ? `https://wa.me/91${prop.phone}` : null,
      canEnquire,
      owner_name: prop.name,
    },
  });
});

// GET /api/enquiries/received/stats — group by property, count
router.get("/received/stats", verifyToken, async (req, res) => {
  const { rows } = await query(
    `SELECT e.property_id, p.property_id as pid, p.title,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE e.status = 'new') as new_count,
            COUNT(*) FILTER (WHERE e.status = 'replied') as replied_count,
            COUNT(*) FILTER (WHERE e.status = 'closed') as closed_count
     FROM enquiries e
     JOIN properties p ON p.id = e.property_id
     WHERE e.owner_id = $1
     GROUP BY e.property_id, p.property_id, p.title
     ORDER BY total DESC`,
    [req.user.id],
  );

  return res.json({ success: true, data: { stats: rows } });
});

module.exports = router;
