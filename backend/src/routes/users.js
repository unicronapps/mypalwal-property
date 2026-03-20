const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const { generatePresignedPutUrl } = require("../services/s3");

// GET /api/users/me — own profile + listing count + active subscription
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, phone, role, avatar_url, phone_verified, is_active,
              agency_name, agency_logo_url, bio, verified_dealer,
              last_login_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "User not found", code: "NOT_FOUND" });

    const user = rows[0];

    // Listing counts
    const { rows: listingStats } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_listings,
         COUNT(*) FILTER (WHERE status = 'sold') as sold_listings,
         COUNT(*) as total_listings
       FROM properties WHERE owner_id = $1`,
      [req.user.id]
    );

    // Enquiry counts
    const { rows: enquiryStats } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE owner_id = $1) as received,
         COUNT(*) FILTER (WHERE buyer_id = $1) as sent
       FROM enquiries WHERE owner_id = $1 OR buyer_id = $1`,
      [req.user.id]
    );

    // Active subscription
    const { rows: subRows } = await query(
      `SELECT s.id, s.plan_id, s.amount, s.status, s.starts_at, s.expires_at,
              p.name as plan_name, p.listing_limit, p.features
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
       ORDER BY s.expires_at DESC LIMIT 1`,
      [req.user.id]
    );
    const subscription = subRows[0] || null;
    const listingLimit = subscription ? subscription.listing_limit : 5;

    return res.json({
      success: true,
      data: {
        ...user,
        stats: {
          active_listings: parseInt(listingStats[0].active_listings, 10),
          sold_listings: parseInt(listingStats[0].sold_listings, 10),
          total_listings: parseInt(listingStats[0].total_listings, 10),
          enquiries_received: parseInt(enquiryStats[0].received, 10),
          enquiries_sent: parseInt(enquiryStats[0].sent, 10),
        },
        subscription,
        listing_limit: listingLimit,
      },
    });
  } catch (err) {
    console.error("GET /me error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error", code: "INTERNAL_ERROR" });
  }
});

// PUT /api/users/me — update allowed fields only
router.put("/me", verifyToken, async (req, res) => {
  const allowed = ["name", "avatar_url", "agency_name", "bio"];
  const sets = [];
  const params = [];

  allowed.forEach((f) => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      sets.push(`${f} = $${params.length}`);
    }
  });

  if (!sets.length)
    return res.status(400).json({
      success: false,
      message: "No valid fields to update",
      code: "VALIDATION_ERROR",
    });

  params.push(req.user.id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length}
     RETURNING id, name, phone, role, avatar_url, agency_name, bio`,
    params
  );

  return res.json({ success: true, data: rows[0] });
});

// DELETE /api/users/me — soft delete: ban + null out PII
router.delete("/me", verifyToken, async (req, res) => {
  const { confirmation } = req.body;
  if (confirmation !== "DELETE")
    return res.status(400).json({
      success: false,
      message: 'Send { confirmation: "DELETE" } to confirm',
      code: "CONFIRMATION_REQUIRED",
    });

  await query(
    `UPDATE users SET
       is_active = false,
       name = NULL,
       phone = NULL,
       avatar_url = NULL,
       agency_name = NULL,
       bio = NULL,
       updated_at = NOW()
     WHERE id = $1`,
    [req.user.id]
  );

  // Deactivate all listings
  await query(
    `UPDATE properties SET status = 'inactive' WHERE owner_id = $1 AND status = 'active'`,
    [req.user.id]
  );

  return res.json({
    success: true,
    data: { message: "Account deleted successfully" },
  });
});

// POST /api/users/me/avatar — presign upload URL for avatar
router.post("/me/avatar", verifyToken, async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename || !contentType)
    return res.status(400).json({
      success: false,
      message: "filename and contentType required",
      code: "VALIDATION_ERROR",
    });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(contentType))
    return res.status(400).json({
      success: false,
      message: "Only JPEG, PNG, WEBP allowed",
      code: "INVALID_FILE_TYPE",
    });

  try {
    const ext = filename.split(".").pop() || "jpg";
    const { presignedUrl, s3Key, fileUrl } = await generatePresignedPutUrl(
      "avatars",
      ext,
      contentType
    );

    // Update avatar_url immediately (client will PUT to presignedUrl)
    await query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [
      fileUrl,
      req.user.id,
    ]);

    return res.json({
      success: true,
      data: { presignedUrl, s3Key, fileUrl },
    });
  } catch (err) {
    console.error("Avatar presign error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate upload URL",
      code: "S3_ERROR",
    });
  }
});

// PUT /api/users/me/password — no-op for OTP-only auth
router.put("/me/password", verifyToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Password not supported — this app uses OTP authentication only",
    code: "NOT_SUPPORTED",
  });
});

// GET /api/users/:id/profile — public dealer profile (404 if role=user)
router.get("/:id/profile", async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, role, avatar_url, agency_name, agency_logo_url, bio,
            verified_dealer, created_at
     FROM users WHERE id = $1 AND is_active = true`,
    [req.params.id]
  );

  if (!rows.length)
    return res
      .status(404)
      .json({ success: false, message: "User not found", code: "NOT_FOUND" });

  if (rows[0].role === "user")
    return res.status(404).json({
      success: false,
      message: "Profile not available",
      code: "NOT_FOUND",
    });

  const dealer = rows[0];

  // Get dealer's active listings
  const { rows: listings } = await query(
    `SELECT p.id, p.property_id, p.title, p.property_type, p.category,
            p.price, p.price_unit, p.area_sqft, p.area_display_value, p.area_display_unit,
            p.is_verified, p.listed_at,
            pl.city, pl.locality,
            (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
     FROM properties p
     LEFT JOIN property_locations pl ON pl.property_id = p.id
     WHERE p.owner_id = $1 AND p.status = 'active'
     ORDER BY p.listed_at DESC LIMIT 20`,
    [req.params.id]
  );

  const { rows: countRow } = await query(
    `SELECT COUNT(*) FROM properties WHERE owner_id = $1 AND status = 'active'`,
    [req.params.id]
  );

  return res.json({
    success: true,
    data: {
      ...dealer,
      listings,
      total_listings: parseInt(countRow[0].count, 10),
    },
  });
});

// POST /api/users/me/device-token — upsert FCM token
router.post("/me/device-token", verifyToken, async (req, res) => {
  const { token, platform } = req.body;
  if (!token || !platform)
    return res.status(400).json({
      success: false,
      message: "token and platform required",
      code: "VALIDATION_ERROR",
    });

  if (!["web", "ios", "android"].includes(platform))
    return res.status(400).json({
      success: false,
      message: "platform must be web, ios, or android",
      code: "VALIDATION_ERROR",
    });

  const { rows } = await query(
    `INSERT INTO device_tokens (user_id, token, platform, active, last_seen_at)
     VALUES ($1, $2, $3, true, NOW())
     ON CONFLICT (token) DO UPDATE SET
       user_id = $1, platform = $3, active = true, last_seen_at = NOW()
     RETURNING id`,
    [req.user.id, token, platform]
  );

  return res.json({
    success: true,
    data: { id: rows[0].id, message: "Device token registered" },
  });
});

module.exports = router;
