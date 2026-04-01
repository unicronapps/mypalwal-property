const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

router.get("/cities", async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, state FROM cities WHERE is_active = true ORDER BY name`,
  );
  return res.json({ success: true, data: rows });
});

router.get("/localities", async (req, res) => {
  const { city } = req.query;
  if (!city)
    return res
      .status(400)
      .json({
        success: false,
        message: "city query param is required",
        code: "VALIDATION_ERROR",
      });
  const { rows } = await query(
    `SELECT l.id, l.name, l.pincode FROM localities l JOIN cities c ON c.id = l.city_id WHERE c.name ILIKE $1 AND l.is_active = true ORDER BY l.name`,
    [city],
  );
  return res.json({ success: true, data: rows });
});

module.exports = router;
