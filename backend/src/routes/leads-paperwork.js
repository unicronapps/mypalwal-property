const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const jwt = require("jsonwebtoken");

// Soft auth — attaches req.user if a valid token is present, never blocks
function softAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_ACCESS_SECRET,
      );
      req.user = { id: decoded.sub, role: decoded.role };
    } catch {
      // invalid / expired token — treat as guest
    }
  }
  next();
}

const VALID_SERVICES = ["registry", "mutation", "noc", "loan_noc", "other"];
const VALID_URGENCY = ["urgent", "this_month", "exploring", "not_sure"];

/*
 * POST /api/leads/paperwork
 * Auth: none (public). Optional Bearer token to credit submitted_by / created_by.
 *
 * ── Request body ────────────────────────────────────────────────────────────
 * {
 *   "name":    "Ramesh Kumar",          // required, 2–60 chars
 *   "phone":   "9812345678",            // required, 10-digit Indian mobile
 *   "city":    "Gurugram",              // required, one of: Gurugram | Faridabad |
 *                                       //   Panipat | Karnal | Rohtak | Ambala |
 *                                       //   Sonipat | Hisar | Other
 *   "service": "registry",             // required, one of: registry | mutation |
 *                                       //   noc | loan_noc | other
 *   "message": "Need registry done for a 200 sq yd plot in Sector 14.",
 *                                       // optional, defaults to "NA"
 *   "urgency": "this_month"            // optional, one of: urgent | this_month |
 *                                       //   exploring | not_sure (default)
 * }
 *
 * ── Success response (201) ──────────────────────────────────────────────────
 * {
 *   "success": true,
 *   "id": "b3f2a1c4-8e7d-4f56-a123-0d1e2f3a4b5c"
 * }
 *
 * ── Error responses ─────────────────────────────────────────────────────────
 * 400 { "success": false, "message": "name, phone, city, and service are required", "code": "VALIDATION_ERROR" }
 * 400 { "success": false, "message": "phone must be a valid 10-digit Indian mobile number", "code": "VALIDATION_ERROR" }
 * 400 { "success": false, "message": "service must be one of: registry, mutation, noc, loan_noc, other", "code": "VALIDATION_ERROR" }
 * 400 { "success": false, "message": "urgency must be one of: urgent, this_month, exploring, not_sure", "code": "VALIDATION_ERROR" }
 */
router.post("/", softAuth, async (req, res) => {
  const { name, phone, city, service, message, urgency } = req.body;

  // Validate required fields
  if (!name || !phone || !city || !service) {
    return res.status(400).json({
      success: false,
      message: "name, phone, city, and service are required",
      code: "VALIDATION_ERROR",
    });
  }

  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "phone must be a valid 10-digit Indian mobile number",
      code: "VALIDATION_ERROR",
    });
  }

  if (!VALID_SERVICES.includes(service)) {
    return res.status(400).json({
      success: false,
      message: `service must be one of: ${VALID_SERVICES.join(", ")}`,
      code: "VALIDATION_ERROR",
    });
  }

  if (urgency && !VALID_URGENCY.includes(urgency)) {
    return res.status(400).json({
      success: false,
      message: `urgency must be one of: ${VALID_URGENCY.join(", ")}`,
      code: "VALIDATION_ERROR",
    });
  }

  // Resolve who to credit based on role
  const isAdmin = req.user?.role === "admin";
  const createdBy = isAdmin ? req.user.id : null;
  const submittedByUserId = !isAdmin && req.user ? req.user.id : null;

  const { rows } = await query(
    `INSERT INTO paperwork_leads
       (name, phone, city, service, message, urgency, created_by, submitted_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      name.trim(),
      phone.trim(),
      city.trim(),
      service,
      message?.trim() || "NA",
      urgency || "not_sure",
      createdBy,
      submittedByUserId,
    ],
  );

  return res.status(201).json({ success: true, id: rows[0].id });
});

module.exports = router;
