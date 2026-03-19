const supabase = require('../config/supabase');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 5;
const MAX_RETRIES = 10;

/**
 * Generates a random 5-char alphanumeric property ID.
 * Per SEARCH-001: IDs are uppercase alphanumeric, used for instant lookup.
 */
function generateId() {
  let result = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

/**
 * Generates a unique property ID with collision retry.
 * @returns {Promise<string>}
 */
async function generateUniquePropertyId() {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const id = generateId();
    const { data } = await supabase
      .from('properties')
      .select('property_id')
      .eq('property_id', id)
      .maybeSingle();

    if (!data) return id; // No collision
  }
  throw new Error('Failed to generate unique property ID after max retries');
}

module.exports = { generateUniquePropertyId };
