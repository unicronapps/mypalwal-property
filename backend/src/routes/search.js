const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/suggest', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ success: true, data: { suggestions: [] } });

  const queryStr = q.trim();
  const suggestions = [];

  if (/^[A-Za-z0-9]{5}$/.test(queryStr)) {
    const { rows } = await query(
      `SELECT property_id, title, id FROM properties WHERE property_id = $1 AND status = 'active'`,
      [queryStr.toUpperCase()]
    );
    if (rows.length) {
      suggestions.push({ type: 'property', label: `${rows[0].title} (ID: ${rows[0].property_id})`, value: rows[0].property_id, property_id: rows[0].property_id, id: rows[0].id });
    }
  }

  const { rows: cities } = await query(
    `SELECT name FROM cities WHERE name ILIKE $1 AND is_active = true LIMIT 5`, [`${queryStr}%`]
  );
  cities.forEach(c => suggestions.push({ type: 'city', label: c.name, value: c.name }));

  const { rows: localities } = await query(
    `SELECT l.name, c.name as city_name FROM localities l JOIN cities c ON c.id = l.city_id WHERE l.name ILIKE $1 AND l.is_active = true LIMIT 5`,
    [`${queryStr}%`]
  );
  localities.forEach(l => suggestions.push({ type: 'locality', label: `${l.name}, ${l.city_name}`, value: l.name, city: l.city_name }));

  if (!suggestions.some(s => s.type === 'property')) {
    const { rows: titles } = await query(
      `SELECT id, property_id, title FROM properties WHERE title ILIKE $1 AND status = 'active' LIMIT 4`,
      [`%${queryStr}%`]
    );
    titles.forEach(p => suggestions.push({ type: 'property', label: p.title, value: p.property_id, property_id: p.property_id, id: p.id }));
  }

  return res.json({ success: true, data: { suggestions: suggestions.slice(0, 10) } });
});

router.get('/property-id/:pid', async (req, res) => {
  const { pid } = req.params;
  if (!/^[A-Za-z0-9]{5}$/.test(pid)) {
    return res.status(400).json({ success: false, message: 'Invalid property ID format', code: 'INVALID_ID' });
  }
  const { rows } = await query(`
    SELECT p.id, p.property_id, p.title, p.property_type, p.category,
           p.price, p.price_unit, p.area_sqft, p.area_display_value, p.area_display_unit,
           p.status, p.is_verified, pl.city, pl.locality,
           (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
    FROM properties p LEFT JOIN property_locations pl ON pl.property_id = p.id
    WHERE p.property_id = $1
  `, [pid.toUpperCase()]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found', code: 'NOT_FOUND' });
  return res.json({ success: true, data: rows[0] });
});

module.exports = router;
