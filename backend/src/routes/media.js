const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucket } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const MAX_PHOTOS = 20;
const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4','video/quicktime','video/x-msvideo'];

router.post('/presign', verifyToken, async (req, res) => {
  const { filename, contentType, propertyId, mediaType } = req.body;
  if (!filename || !contentType || !propertyId || !mediaType) {
    return res.status(400).json({ success: false, message: 'filename, contentType, propertyId, mediaType are required', code: 'VALIDATION_ERROR' });
  }
  if (mediaType === 'photo' && !ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: 'Invalid image type', code: 'INVALID_FILE_TYPE' });
  }
  if (mediaType === 'video' && !ALLOWED_VIDEO_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: 'Invalid video type', code: 'INVALID_FILE_TYPE' });
  }

  const { rows } = await query(`SELECT id, owner_id FROM properties WHERE id = $1`, [propertyId]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found', code: 'NOT_FOUND' });
  if (rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized', code: 'FORBIDDEN' });
  }

  const { rows: existing } = await query(
    `SELECT media_type FROM property_media WHERE property_id = $1`, [propertyId]
  );
  const photoCount = existing.filter(m => m.media_type === 'photo').length;
  const videoCount = existing.filter(m => m.media_type === 'video').length;
  if (mediaType === 'photo' && photoCount >= MAX_PHOTOS) {
    return res.status(400).json({ success: false, message: `Max ${MAX_PHOTOS} photos allowed`, code: 'MEDIA_LIMIT_REACHED' });
  }
  if (mediaType === 'video' && videoCount >= 1) {
    return res.status(400).json({ success: false, message: 'Max 1 video allowed', code: 'MEDIA_LIMIT_REACHED' });
  }

  const ext = path.extname(filename).toLowerCase() || '.jpg';
  const safeName = path.basename(filename, ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50);
  const s3Key = `properties/${propertyId}/${uuidv4()}-${safeName}${ext}`;
  // NEW CODE
  // It is best practice to put the public URL in your .env file
  const publicBaseUrl = process.env.R2_PUBLIC_URL || 'https://pub-75e7337751c14e2f927864034f263b93.r2.dev';

  // R2 public URLs map directly to the root of your bucket, so you do not append the bucket name here.
  // You just append the s3Key.
  const fileUrl = `${publicBaseUrl}/${s3Key}`;
  try {
    const command = new PutObjectCommand({ Bucket: bucket, Key: s3Key, ContentType: contentType });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return res.json({ success: true, data: { presignedUrl, s3Key, fileUrl } });
  } catch (err) {
    console.error('S3 presign error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate upload URL', code: 'S3_ERROR' });
  }
});

router.post('/confirm', verifyToken, async (req, res) => {
  const { propertyId, s3Key, url, mediaType, isCover, displayOrder } = req.body;
  if (!propertyId || !s3Key || !url || !mediaType) {
    return res.status(400).json({ success: false, message: 'propertyId, s3Key, url, mediaType required', code: 'VALIDATION_ERROR' });
  }

  const { rows } = await query(`SELECT owner_id FROM properties WHERE id = $1`, [propertyId]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found', code: 'NOT_FOUND' });
  if (rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized', code: 'FORBIDDEN' });
  }

  if (isCover) {
    await query(`UPDATE property_media SET is_cover = false WHERE property_id = $1`, [propertyId]);
  }

  let order = displayOrder;
  if (order === undefined) {
    const { rows: maxRow } = await query(
      `SELECT COALESCE(MAX(display_order), -1) as max_order FROM property_media WHERE property_id = $1`, [propertyId]
    );
    order = maxRow[0].max_order + 1;
  }

  const { rows: media } = await query(`
    INSERT INTO property_media (property_id, s3_key, url, media_type, is_cover, display_order, uploaded_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [propertyId, s3Key, url, mediaType, isCover || false, order, req.user.id]);

  return res.status(201).json({ success: true, data: media[0] });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const { rows } = await query(
    `SELECT id, s3_key, uploaded_by FROM property_media WHERE id = $1`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Media not found', code: 'NOT_FOUND' });
  if (rows[0].uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized', code: 'FORBIDDEN' });
  }
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: rows[0].s3_key }));
  } catch (err) {
    console.error('S3 delete error:', err.message);
  }
  await query(`DELETE FROM property_media WHERE id = $1`, [req.params.id]);
  return res.json({ success: true, data: { message: 'Media deleted' } });
});

router.patch('/reorder', verifyToken, async (req, res) => {
  const { propertyId, order } = req.body;
  if (!propertyId || !Array.isArray(order)) {
    return res.status(400).json({ success: false, message: 'propertyId and order array required', code: 'VALIDATION_ERROR' });
  }
  const { rows } = await query(`SELECT owner_id FROM properties WHERE id = $1`, [propertyId]);
  if (!rows.length || (rows[0].owner_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Not authorized', code: 'FORBIDDEN' });
  }
  for (const { id, display_order } of order) {
    await query(`UPDATE property_media SET display_order = $1 WHERE id = $2 AND property_id = $3`, [display_order, id, propertyId]);
  }
  return res.json({ success: true, data: { message: 'Order updated' } });
});

module.exports = router;
