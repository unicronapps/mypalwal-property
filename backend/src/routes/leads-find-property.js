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

// POST /api/leads/find-property — public endpoint
router.post("/", softAuth, async (req, res) => {
  const {
    name,
    phone,
    city,
    requirement,
    localities,
    otherLocality,
    budgetMin,
    budgetMax,
  } = req.body;

  // Validate required fields
  if (!name || !phone || !city || !requirement) {
    return res.status(400).json({
      success: false,
      message: "name, phone, city, and requirement are required",
      code: "VALIDATION_ERROR",
    });
  }

  // Validate phone — 10-digit Indian mobile
  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "phone must be a valid 10-digit Indian mobile number",
      code: "VALIDATION_ERROR",
    });
  }

  // Resolve who to credit based on role
  const isAdmin = req.user?.role === "admin";
  const createdBy = isAdmin ? req.user.id : null;
  const submittedByUserId = !isAdmin && req.user ? req.user.id : null;

  console.log(req.user);

  const { rows } = await query(
    `INSERT INTO property_request_leads
       (name, phone, city, requirement, localities, other_locality,
        budget_min, budget_max, created_by, submitted_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      name.trim(),
      phone.trim(),
      city.trim(),
      requirement.trim(),
      Array.isArray(localities) ? localities : [],
      otherLocality || null,
      budgetMin || null,
      budgetMax || null,
      createdBy,
      submittedByUserId,
    ],
  );

  const leadId = rows[0].id;

  return res.status(201).json({ success: true, id: leadId });
});

module.exports = router;
