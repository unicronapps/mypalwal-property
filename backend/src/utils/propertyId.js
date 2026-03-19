const { query } = require('../config/db');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 5;
const MAX_RETRIES = 10;

function generateId() {
  let result = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

async function generateUniquePropertyId() {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const id = generateId();
    const { rows } = await query(`SELECT property_id FROM properties WHERE property_id = $1`, [id]);
    if (!rows.length) return id;
  }
  throw new Error('Failed to generate unique property ID after max retries');
}

module.exports = { generateUniquePropertyId };
