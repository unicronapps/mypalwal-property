/**
 * Area unit conversion utilities.
 * Per DB-002: all areas stored as sqft internally.
 * Conversion factors to sqft:
 */
const TO_SQFT = {
  sqft: 1,
  sqm: 10.7639,
  sqyd: 9,
  acre: 43560,
  hectare: 107639,
  // Indian units
  bigha: 27000,       // 1 bigha (Haryana/Punjab) ≈ 27,000 sqft (varies by region)
  biswa: 1350,        // 1 biswa = 1/20 bigha (approx)
  marla: 272.25,      // 1 marla = 272.25 sqft
  kanal: 5445,        // 1 kanal = 20 marla
  gaj: 9,             // 1 gaj = 1 sqyd = 9 sqft
  cent: 435.6,        // 1 cent = 1/100 acre
  guntha: 1089,       // 1 guntha = 1/40 acre
};

/**
 * Converts area from any unit to sqft.
 * @param {number} value
 * @param {string} unit - one of the keys in TO_SQFT
 * @returns {number} area in sqft
 */
function toSqft(value, unit) {
  const factor = TO_SQFT[unit.toLowerCase()];
  if (!factor) throw new Error(`Unknown area unit: ${unit}`);
  return value * factor;
}

/**
 * Converts sqft to any unit.
 * @param {number} sqftValue
 * @param {string} unit
 * @returns {number}
 */
function fromSqft(sqftValue, unit) {
  const factor = TO_SQFT[unit.toLowerCase()];
  if (!factor) throw new Error(`Unknown area unit: ${unit}`);
  return sqftValue / factor;
}

/**
 * Returns human-readable area string in given unit.
 * @param {number} sqftValue
 * @param {string} unit
 * @param {number} [decimals=2]
 * @returns {string}
 */
function formatArea(sqftValue, unit, decimals = 2) {
  const value = fromSqft(sqftValue, unit);
  return `${value.toFixed(decimals)} ${unit}`;
}

module.exports = { toSqft, fromSqft, formatArea, TO_SQFT };
