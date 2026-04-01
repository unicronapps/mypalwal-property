const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { query, getClient } = require("../config/db");

// All admin routes require admin role
router.use(verifyToken, requireRole("admin"));

// ─── GET /api/admin/stats ───
// Tables: users, properties, payments, boosts
// users: is_active (no is_banned)
// properties: status IN (active, inactive, pending, sold, rented)
// payments: amount, status IN (created, paid, failed, refunded)
// boosts: expires_at, status IN (active, expired, cancelled)
router.get("/stats", async (req, res) => {
  try {
    const [usersR, propsR, pendingR, revenueR, boostsR] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM users WHERE is_active = true"),
      query(
        `SELECT status, COUNT(*)::int AS count FROM properties GROUP BY status`,
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM properties WHERE status = 'pending'`,
      ),
      query(`
        SELECT COALESCE(SUM(amount), 0)::int AS revenue
        FROM payments
        WHERE status = 'paid'
          AND created_at >= date_trunc('month', NOW())
      `),
      query(
        `SELECT COUNT(*)::int AS count FROM boosts WHERE status = 'active' AND expires_at > NOW()`,
      ),
    ]);

    const statusCounts = {};
    propsR.rows.forEach((r) => {
      statusCounts[r.status] = r.count;
    });

    res.json({
      success: true,
      data: {
        total_users: usersR.rows[0].count,
        total_listings: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        listings_by_status: statusCounts,
        pending_approvals: pendingR.rows[0].count,
        revenue_this_month: revenueR.rows[0].revenue,
        active_boosts: boostsR.rows[0].count,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: "Failed to load stats" });
  }
});

// ─── GET /api/admin/properties ───
// properties: no city column — city is in property_locations
// property_media: cover photo uses is_cover = true, column is url (not file_url)
router.get("/properties", async (req, res) => {
  try {
    const { status, type, city, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status && status !== "all") {
      conditions.push(`p.status = $${idx++}`);
      params.push(status);
    }
    if (type) {
      conditions.push(`p.property_type = $${idx++}`);
      params.push(type);
    }
    if (city) {
      conditions.push(`pl.city ILIKE $${idx++}`);
      params.push(`%${city}%`);
    }
    if (search) {
      conditions.push(`(p.title ILIKE $${idx} OR p.property_id = $${idx + 1})`);
      params.push(`%${search}%`, search.toUpperCase());
      idx += 2;
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [countR, dataR] = await Promise.all([
      query(
        `
        SELECT COUNT(*)::int AS total
        FROM properties p
        LEFT JOIN property_locations pl ON pl.property_id = p.id
        ${where}
      `,
        params,
      ),
      query(
        `
        SELECT p.id, p.property_id, p.title, p.property_type, p.status,
               p.is_verified, p.is_boosted, p.created_at,
               u.name AS owner_name, u.phone AS owner_phone,
               pl.city, pl.locality,
               (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) AS cover_photo
        FROM properties p
        LEFT JOIN users u ON u.id = p.owner_id
        LEFT JOIN property_locations pl ON pl.property_id = p.id
        ${where}
        ORDER BY p.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `,
        [...params, limit, offset],
      ),
    ]);

    res.json({
      success: true,
      data: {
        properties: dataR.rows,
        total: countR.rows[0].total,
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    console.error("Admin properties error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load properties" });
  }
});

// ─── PATCH /api/admin/properties/:id/approve ───
// status: pending → active
router.patch("/properties/:id/approve", async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE properties SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING id, owner_id, title`,
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    res.json({ success: true, data: { id: rows[0].id, status: "active" } });
  } catch (err) {
    console.error("Admin approve error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to approve property" });
  }
});

// ─── PATCH /api/admin/properties/:id/reject ───
// status: set to inactive (no 'deleted' in schema check)
router.patch("/properties/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason)
      return res
        .status(400)
        .json({ success: false, message: "Reason is required" });

    const { rows } = await query(
      `UPDATE properties SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING id, owner_id, title`,
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    res.json({ success: true, data: { id: rows[0].id, status: "inactive" } });
  } catch (err) {
    console.error("Admin reject error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to reject property" });
  }
});

// ─── PATCH /api/admin/properties/:id/verify ───
// Column is is_verified (not is_verified_property)
router.patch("/properties/:id/verify", async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE properties SET is_verified = NOT is_verified, updated_at = NOW()
       WHERE id = $1 RETURNING id, is_verified`,
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Admin verify property error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle verification" });
  }
});

// ─── GET /api/admin/users ───
// users: no email column, no is_banned column, no ban_reason column
// verified_dealer (not is_verified_dealer), is_active (not is_banned)
router.get("/users", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (role && role !== "all") {
      conditions.push(`u.role = $${idx++}`);
      params.push(role);
    }
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.phone ILIKE $${idx + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [countR, dataR] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params),
      query(
        `
        SELECT u.id, u.name, u.phone, u.role, u.verified_dealer,
               u.is_active, u.avatar_url, u.agency_name, u.created_at,
               (SELECT COUNT(*)::int FROM properties WHERE owner_id = u.id AND status = 'active') AS active_listings
        FROM users u
        ${where}
        ORDER BY u.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `,
        [...params, limit, offset],
      ),
    ]);

    res.json({
      success: true,
      data: {
        users: dataR.rows,
        total: countR.rows[0].total,
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ success: false, message: "Failed to load users" });
  }
});

// ─── PATCH /api/admin/users/:id/ban ───
// users table has is_active (boolean). Ban = set is_active=false
router.patch("/users/:id/ban", async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING id, is_active`,
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // If deactivating (banning), also deactivate their listings
    if (!rows[0].is_active) {
      await query(
        `UPDATE properties SET status = 'inactive' WHERE owner_id = $1 AND status = 'active'`,
        [req.params.id],
      );
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Admin ban error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update user status" });
  }
});

// ─── PATCH /api/admin/users/:id/role ───
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "dealer"].includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Role must be user or dealer" });
    }

    const { rows } = await query(
      `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 AND role != 'admin' RETURNING id, role`,
      [req.params.id, role],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "User not found or is admin" });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Admin role change error:", err);
    res.status(500).json({ success: false, message: "Failed to change role" });
  }
});

// ─── PATCH /api/admin/dealers/:id/verify ───
// Column is verified_dealer (not is_verified_dealer)
router.patch("/dealers/:id/verify", async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE users SET verified_dealer = NOT verified_dealer, updated_at = NOW()
       WHERE id = $1 AND role = 'dealer' RETURNING id, verified_dealer`,
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Dealer not found" });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Admin verify dealer error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to toggle dealer verification",
    });
  }
});

// ─── GET /api/admin/reports ───
// reports: status IN (pending, reviewed, resolved, dismissed)
// property_media: is_cover=true, column is url
router.get("/reports", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status && status !== "all") {
      conditions.push(`r.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [countR, dataR] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM reports r ${where}`, params),
      query(
        `
        SELECT r.id, r.reason, r.description, r.status, r.created_at,
               p.id AS property_id, p.property_id AS pid, p.title AS property_title, p.owner_id,
               pl.city AS property_city,
               (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) AS property_photo,
               reporter.name AS reporter_name, reporter.phone AS reporter_phone,
               owner.name AS owner_name
        FROM reports r
        JOIN properties p ON p.id = r.property_id
        JOIN users reporter ON reporter.id = r.reporter_id
        LEFT JOIN users owner ON owner.id = p.owner_id
        LEFT JOIN property_locations pl ON pl.property_id = p.id
        ${where}
        ORDER BY r.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `,
        [...params, limit, offset],
      ),
    ]);

    res.json({
      success: true,
      data: {
        reports: dataR.rows,
        total: countR.rows[0].total,
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    console.error("Admin reports error:", err);
    res.status(500).json({ success: false, message: "Failed to load reports" });
  }
});

// ─── PATCH /api/admin/reports/:id ───
// report status: pending→dismissed or pending→resolved
// property status: →inactive (no 'deleted' in schema)
// user: is_active=false (no is_banned)
router.patch("/reports/:id", async (req, res) => {
  const client = await getClient();
  try {
    const { action } = req.body;
    if (!["dismiss", "remove", "ban_poster"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await client.query("BEGIN");

    const { rows: reportRows } = await client.query(
      `SELECT r.id, r.property_id, p.owner_id FROM reports r JOIN properties p ON p.id = r.property_id WHERE r.id = $1`,
      [req.params.id],
    );
    if (!reportRows.length) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const report = reportRows[0];

    if (action === "dismiss") {
      await client.query(
        `UPDATE reports SET status = 'dismissed' WHERE id = $1`,
        [req.params.id],
      );
    } else if (action === "remove") {
      await client.query(
        `UPDATE reports SET status = 'resolved' WHERE id = $1`,
        [req.params.id],
      );
      await client.query(
        `UPDATE properties SET status = 'inactive' WHERE id = $1`,
        [report.property_id],
      );
    } else if (action === "ban_poster") {
      await client.query(
        `UPDATE reports SET status = 'resolved' WHERE id = $1`,
        [req.params.id],
      );
      await client.query(
        `UPDATE properties SET status = 'inactive' WHERE id = $1`,
        [report.property_id],
      );
      await client.query(
        `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [report.owner_id],
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, data: { action } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin report action error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to process report" });
  } finally {
    client.release();
  }
});

// ─── GET /api/admin/payments ───
// payments: amount (not amount_paid), status IN (created, paid, failed, refunded)
// metadata JSONB has plan_id, property_id etc — no reference_id column
router.get("/payments", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [countR, dataR, todayR, monthR, totalR] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM payments`),
      query(
        `
        SELECT pay.id, pay.type, pay.amount, pay.status, pay.created_at,
               pay.razorpay_order_id, pay.razorpay_payment_id, pay.metadata,
               u.name AS user_name, u.phone AS user_phone
        FROM payments pay
        JOIN users u ON u.id = pay.user_id
        ORDER BY pay.created_at DESC
        LIMIT $1 OFFSET $2
      `,
        [limit, offset],
      ),
      query(
        `SELECT COALESCE(SUM(amount), 0)::int AS revenue FROM payments WHERE status = 'paid' AND created_at >= CURRENT_DATE`,
      ),
      query(
        `SELECT COALESCE(SUM(amount), 0)::int AS revenue FROM payments WHERE status = 'paid' AND created_at >= date_trunc('month', NOW())`,
      ),
      query(
        `SELECT COALESCE(SUM(amount), 0)::int AS revenue FROM payments WHERE status = 'paid'`,
      ),
    ]);

    res.json({
      success: true,
      data: {
        payments: dataR.rows,
        total: countR.rows[0].total,
        page: +page,
        limit: +limit,
        revenue: {
          today: todayR.rows[0].revenue,
          this_month: monthR.rows[0].revenue,
          all_time: totalR.rows[0].revenue,
        },
      },
    });
  } catch (err) {
    console.error("Admin payments error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load payments" });
  }
});

// ─── POST /api/admin/boost/grant ───
// boosts: amount (not amount_paid), no granted_by_admin column
// Required columns: property_id, user_id, amount, duration_days, expires_at, status
router.post("/boost/grant", async (req, res) => {
  const client = await getClient();
  try {
    const { property_id, duration_days } = req.body;
    if (!property_id || !duration_days) {
      return res.status(400).json({
        success: false,
        message: "property_id and duration_days required",
      });
    }

    await client.query("BEGIN");

    const { rows: propRows } = await client.query(
      `SELECT id, owner_id FROM properties WHERE id = $1`,
      [property_id],
    );
    if (!propRows.length) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration_days));

    const { rows: boostRows } = await client.query(
      `
      INSERT INTO boosts (property_id, user_id, amount, duration_days, status, expires_at)
      VALUES ($1, $2, 0, $3, 'active', $4)
      RETURNING id
    `,
      [property_id, propRows[0].owner_id, duration_days, expiresAt],
    );

    await client.query(
      `
      UPDATE properties SET is_boosted = true, boost_expires_at = $2, updated_at = NOW() WHERE id = $1
    `,
      [property_id, expiresAt],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      data: { boost_id: boostRows[0].id, expires_at: expiresAt },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin grant boost error:", err);
    res.status(500).json({ success: false, message: "Failed to grant boost" });
  } finally {
    client.release();
  }
});

// ─── GET /api/admin/analytics ───
// properties: city is in property_locations table
router.get("/analytics", async (req, res) => {
  try {
    const [
      byTypeR,
      byCityR,
      byMonthR,
      enquiriesByMonthR,
      topViewedR,
      userGrowthR,
    ] = await Promise.all([
      query(
        `SELECT property_type, COUNT(*)::int AS count FROM properties WHERE status = 'active' GROUP BY property_type ORDER BY count DESC`,
      ),
      query(`
        SELECT pl.city, COUNT(*)::int AS count
        FROM properties p
        JOIN property_locations pl ON pl.property_id = p.id
        WHERE p.status = 'active'
        GROUP BY pl.city ORDER BY count DESC LIMIT 10
      `),
      query(`
        SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
        FROM properties
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `),
      query(`
        SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
        FROM enquiries
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `),
      query(`
        SELECT p.id, p.property_id, p.title, pl.city, p.property_type, p.view_count
        FROM properties p
        LEFT JOIN property_locations pl ON pl.property_id = p.id
        WHERE p.status = 'active'
        ORDER BY p.view_count DESC
        LIMIT 10
      `),
      query(`
        SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `),
      // TODO: search_terms from search_logs table (future)
    ]);

    res.json({
      success: true,
      data: {
        listings_by_type: byTypeR.rows,
        listings_by_city: byCityR.rows,
        listings_by_month: byMonthR.rows,
        enquiries_by_month: enquiriesByMonthR.rows,
        top_viewed_properties: topViewedR.rows,
        user_growth_by_month: userGrowthR.rows,
        search_terms: [], // TODO: implement when search_logs table added
      },
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load analytics" });
  }
});

module.exports = router;
