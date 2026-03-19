const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { toSqft } = require('../utils/areaConvert');
const { generateUniquePropertyId } = require('../utils/propertyId');
const { ATTRIBUTE_SCHEMAS, PROPERTY_TYPES } = require('../constants/propertyAttributes');

// GET /api/properties/attributes/:type
router.get('/attributes/:type', (req, res) => {
  const schema = ATTRIBUTE_SCHEMAS[req.params.type];
  if (!schema) return res.status(404).json({ success: false, message: `Unknown property type: ${req.params.type}`, code: 'INVALID_TYPE' });
  return res.json({ success: true, data: { type: req.params.type, fields: schema } });
});

// GET /api/properties/featured
router.get('/featured', async (req, res) => {
  const { rows } = await query(`
    SELECT p.id, p.property_id, p.title, p.property_type, p.category,
           p.price, p.price_unit, p.price_negotiable,
           p.area_sqft, p.area_display_value, p.area_display_unit,
           p.status, p.is_verified, p.is_featured, p.listed_at, p.view_count,
           u.id as owner_id, u.name as owner_name, u.verified_dealer as is_verified_dealer,
           pl.city, pl.locality,
           (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
    FROM properties p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN property_locations pl ON pl.property_id = p.id
    WHERE p.status = 'active' AND p.is_featured = true
    ORDER BY p.listed_at DESC LIMIT 8
  `);
  return res.json({ success: true, data: { listings: rows } });
});

// GET /api/properties/my/listings
router.get('/my/listings', verifyToken, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [`p.owner_id = $1`];
  const params = [req.user.id];
  if (status) { conditions.push(`p.status = $${params.length + 1}`); params.push(status); }

  const countRes = await query(
    `SELECT COUNT(*) FROM properties p WHERE ${conditions.join(' AND ')}`, params
  );

  params.push(limitNum, offset);
  const { rows } = await query(`
    SELECT p.id, p.property_id, p.title, p.property_type, p.category,
           p.price, p.price_unit, p.area_sqft, p.area_display_value, p.area_display_unit,
           p.status, p.is_verified, p.view_count, p.listed_at,
           pl.city, pl.locality,
           (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
    FROM properties p
    LEFT JOIN property_locations pl ON pl.property_id = p.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.listed_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  return res.json({
    success: true,
    data: { listings: rows, total: parseInt(countRes.rows[0].count, 10), page: pageNum, limit: limitNum },
  });
});

// GET /api/properties — full filter search
router.get('/', async (req, res) => {
  const {
    q, type, category, city, locality,
    min_price, max_price, min_area, max_area, area_unit = 'sqft',
    possession, verified_only, posted_by,
    sort = 'newest', page = 1, limit = 20,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  // SEARCH-001: 5-char alphanumeric direct lookup
  if (q && /^[A-Za-z0-9]{5}$/.test(q.trim())) {
    const { rows } = await query(`
      SELECT p.id, p.property_id, p.title, p.property_type, p.category,
             p.price, p.price_unit, p.price_negotiable,
             p.area_sqft, p.area_display_value, p.area_display_unit,
             p.status, p.is_verified, p.listed_at, p.view_count,
             u.name as owner_name, u.verified_dealer as is_verified_dealer,
             pl.city, pl.locality,
             (SELECT url FROM property_media pm WHERE pm.property_id = p.id AND pm.is_cover = true LIMIT 1) as cover_photo
      FROM properties p
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN property_locations pl ON pl.property_id = p.id
      WHERE p.property_id = $1 AND p.status = 'active'
    `, [q.trim().toUpperCase()]);

    if (rows.length) {
      return res.json({ success: true, data: { listings: rows, total: 1, page: 1, limit: limitNum, propertyIdMatch: true } });
    }
  }

  const conditions = [`p.status = 'active'`];
  const params = [];

  function addParam(val) { params.push(val); return `$${params.length}`; }

  if (type) conditions.push(`p.property_type = ${addParam(type)}`);
  if (category) conditions.push(`p.category = ${addParam(category)}`);
  if (posted_by) conditions.push(`p.owner_id = ${addParam(posted_by)}`);
  if (verified_only === 'true') conditions.push(`p.is_verified = true`);
  if (min_price) conditions.push(`p.price >= ${addParam(parseFloat(min_price))}`);
  if (max_price) conditions.push(`p.price <= ${addParam(parseFloat(max_price))}`);
  if (possession) conditions.push(`p.possession_status = ${addParam(possession)}`);
  if (city) conditions.push(`pl.city ILIKE ${addParam(city)}`);
  if (locality) conditions.push(`pl.locality ILIKE ${addParam(locality)}`);

  if (min_area) {
    try { conditions.push(`p.area_sqft >= ${addParam(toSqft(parseFloat(min_area), area_unit))}`); } catch {}
  }
  if (max_area) {
    try { conditions.push(`p.area_sqft <= ${addParam(toSqft(parseFloat(max_area), area_unit))}`); } catch {}
  }
  if (q) {
    conditions.push(`(p.title ILIKE ${addParam('%' + q + '%')} OR p.description ILIKE $${params.length})`);
  }

  const whereClause = conditions.join(' AND ');

  const sortMap = {
    price_asc: 'p.price ASC', price_desc: 'p.price DESC',
    area_asc: 'p.area_sqft ASC', area_desc: 'p.area_sqft DESC',
    oldest: 'p.listed_at ASC', newest: 'p.listed_at DESC',
  };
  const orderBy = sortMap[sort] || 'p.listed_at DESC';

  const countRes = await query(
    `SELECT COUNT(*) FROM properties p LEFT JOIN property_locations pl ON pl.property_id = p.id WHERE ${whereClause}`,
    params
  );

  params.push(limitNum, offset);
  const { rows } = await query(`
    SELECT p.id, p.property_id, p.title, p.property_type, p.category,
           p.price, p.price_unit, p.price_negotiable,
           p.area_sqft, p.area_display_value, p.area_display_unit,
           p.status, p.is_verified, p.listed_at, p.view_count,
           u.name as owner_name, u.verified_dealer as is_verified_dealer,
           pl.city, pl.locality,
           (SELECT url FROM property_media pm2 WHERE pm2.property_id = p.id AND pm2.is_cover = true LIMIT 1) as cover_photo
    FROM properties p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN property_locations pl ON pl.property_id = p.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  const total = parseInt(countRes.rows[0].count, 10);
  return res.json({
    success: true,
    data: { listings: rows, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// POST /api/properties
router.post('/', verifyToken, async (req, res) => {
  const {
    title, description, property_type, category,
    price, price_negotiable, price_unit,
    area_value, area_unit,
    status = 'active', possession_status,
    contact_call, contact_whatsapp, contact_enquiry,
    attributes,
    city, locality, pincode, landmark, address_line, state,
    latitude, longitude, amenities,
  } = req.body;

  if (!title || !property_type || !category || price === undefined || !area_value || !area_unit || !city || !locality) {
    return res.status(400).json({ success: false, message: 'title, property_type, category, price, area_value, area_unit, city, locality are required', code: 'VALIDATION_ERROR' });
  }
  if (!PROPERTY_TYPES.includes(property_type)) {
    return res.status(400).json({ success: false, message: `Invalid property type`, code: 'INVALID_TYPE' });
  }
  if (!contact_call && !contact_whatsapp && !contact_enquiry) {
    return res.status(400).json({ success: false, message: 'At least one contact preference must be enabled', code: 'INVALID_CONTACT_PREFERENCE' });
  }

  let area_sqft;
  try { area_sqft = toSqft(parseFloat(area_value), area_unit); }
  catch (err) { return res.status(400).json({ success: false, message: err.message, code: 'INVALID_AREA_UNIT' }); }

  let property_id;
  try { property_id = await generateUniquePropertyId(); }
  catch { return res.status(500).json({ success: false, message: 'Failed to generate property ID', code: 'ID_GENERATION_FAILED' }); }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [property] } = await client.query(`
      INSERT INTO properties (
        property_id, owner_id, title, description, property_type, category,
        price, price_negotiable, price_unit, area_sqft, area_display_value, area_display_unit,
        status, possession_status, contact_call, contact_whatsapp, contact_enquiry, attributes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id, property_id
    `, [
      property_id, req.user.id, title.trim(), description?.trim() || null, property_type, category,
      parseFloat(price), price_negotiable || false, price_unit || 'total',
      area_sqft, parseFloat(area_value), area_unit,
      status, possession_status || null,
      contact_call !== false, contact_whatsapp === true, contact_enquiry !== false,
      JSON.stringify(attributes || {}),
    ]);

    await client.query(`
      INSERT INTO property_locations (property_id, city, locality, pincode, landmark, address_line, state, latitude, longitude)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      property.id, city.trim(), locality.trim(), pincode || null, landmark?.trim() || null,
      address_line?.trim() || null, state || 'Haryana',
      latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
    ]);

    if (amenities?.length) {
      for (const amenity of amenities) {
        await client.query(
          `INSERT INTO property_amenities (property_id, amenity) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [property.id, amenity]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      data: { id: property.id, property_id: property.property_id, message: 'Listing created successfully' },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create property error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create listing', code: 'DB_ERROR' });
  } finally {
    client.release();
  }
});

// GET /api/properties/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const isPropertyId = /^[A-Z0-9]{5}$/i.test(id) && id.length === 5;
  const whereClause = isPropertyId ? `p.property_id = $1` : `p.id = $1`;
  const paramVal = isPropertyId ? id.toUpperCase() : id;

  const { rows } = await query(`
    SELECT p.*,
           u.id as owner_id, u.name as owner_name, u.phone as owner_phone,
           u.verified_dealer, u.avatar_url, u.agency_name,
           pl.city, pl.locality, pl.pincode, pl.landmark, pl.address_line,
           pl.state, pl.latitude, pl.longitude
    FROM properties p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN property_locations pl ON pl.property_id = p.id
    WHERE ${whereClause}
  `, [paramVal]);

  if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found', code: 'NOT_FOUND' });
  const property = rows[0];

  // Record view (dedup within 30 min)
  if (req.user?.id) {
    const { rows: recentViews } = await query(
      `SELECT id FROM property_views WHERE property_id = $1 AND user_id = $2 AND viewed_at > NOW() - INTERVAL '30 minutes' LIMIT 1`,
      [property.id, req.user.id]
    );
    if (!recentViews.length) {
      await query(`INSERT INTO property_views (property_id, user_id) VALUES ($1, $2)`, [property.id, req.user.id]);
      await query(`UPDATE properties SET view_count = view_count + 1 WHERE id = $1`, [property.id]);
    }
  }

  // Media
  const { rows: media } = await query(
    `SELECT id, url, s3_key, media_type, is_cover, display_order FROM property_media WHERE property_id = $1 ORDER BY display_order ASC`,
    [property.id]
  );

  // Amenities
  const { rows: amenityRows } = await query(
    `SELECT amenity FROM property_amenities WHERE property_id = $1`,
    [property.id]
  );

  // Similar listings
  const { rows: similar } = await query(`
    SELECT p2.id, p2.property_id, p2.title, p2.property_type, p2.category,
           p2.price, p2.price_unit, p2.area_sqft, p2.area_display_value, p2.area_display_unit,
           p2.is_verified, p2.listed_at,
           pl2.city, pl2.locality,
           (SELECT url FROM property_media pm WHERE pm.property_id = p2.id AND pm.is_cover = true LIMIT 1) as cover_photo
    FROM properties p2
    LEFT JOIN property_locations pl2 ON pl2.property_id = p2.id
    WHERE p2.property_type = $1 AND p2.status = 'active' AND p2.id != $2
    LIMIT 6
  `, [property.property_type, property.id]);

  const isLoggedIn = !!req.user;

  return res.json({
    success: true,
    data: {
      ...property,
      owner: {
        id: property.owner_id,
        name: property.owner_name,
        phone: isLoggedIn ? property.owner_phone : null,
        verified_dealer: property.verified_dealer,
        avatar_url: property.avatar_url,
        agency_name: property.agency_name,
      },
      media,
      amenities: amenityRows.map(r => r.amenity),
      similar,
      contact_info: {
        can_call: property.contact_call && isLoggedIn,
        can_whatsapp: property.contact_whatsapp && isLoggedIn,
        can_enquire: property.contact_enquiry,
        phone: isLoggedIn ? property.owner_phone : null,
        whatsapp_url: isLoggedIn && property.contact_whatsapp && property.owner_phone
          ? `https://wa.me/91${property.owner_phone}` : null,
        show_login_prompt: !isLoggedIn && (property.contact_call || property.contact_whatsapp),
      },
    },
  });
});

// PUT /api/properties/:id
router.put('/:id', verifyToken, async (req, res) => {
  const { rows } = await query(`SELECT id, owner_id FROM properties WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found', code: 'NOT_FOUND' });
  if (rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized', code: 'FORBIDDEN' });
  }

  const allowed = ['title','description','price','price_negotiable','price_unit','possession_status','contact_call','contact_whatsapp','contact_enquiry','attributes','status'];
  const sets = [];
  const params = [];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) {
      params.push(f === 'attributes' ? JSON.stringify(req.body[f]) : req.body[f]);
      sets.push(`${f} = $${params.length}`);
    }
  });
  if (req.body.area_value && req.body.area_unit) {
    params.push(toSqft(parseFloat(req.body.area_value), req.body.area_unit));
    sets.push(`area_sqft = $${params.length}`);
    params.push(parseFloat(req.body.area_value));
    sets.push(`area_display_value = $${params.length}`);
    params.push(req.body.area_unit);
    sets.push(`area_display_unit = $${params.length}`);
  }

  if (!sets.length) return res.status(400).json({ success: false, message: 'No valid fields to update', code: 'VALIDATION_ERROR' });

  params.push(req.params.id);
  await query(`UPDATE properties SET ${sets.join(', ')} WHERE id = $${params.length}`, params);

  if (req.body.city || req.body.locality) {
    const locSets = [];
    const locParams = [];
    if (req.body.city) { locParams.push(req.body.city); locSets.push(`city = $${locParams.length}`); }
    if (req.body.locality) { locParams.push(req.body.locality); locSets.push(`locality = $${locParams.length}`); }
    if (req.body.pincode) { locParams.push(req.body.pincode); locSets.push(`pincode = $${locParams.length}`); }
    locParams.push(req.params.id);
    await query(`UPDATE property_locations SET ${locSets.join(', ')} WHERE property_id = $${locParams.length}`, locParams);
  }

  return res.json({ success: true, data: { message: 'Listing updated' } });
});

// DELETE /api/properties/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const { rows } = await query(`SELECT owner_id FROM properties WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found', code: 'NOT_FOUND' });
  if (rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized', code: 'FORBIDDEN' });
  }
  await query(`UPDATE properties SET status = 'inactive' WHERE id = $1`, [req.params.id]);
  return res.json({ success: true, data: { message: 'Listing removed' } });
});

module.exports = router;
