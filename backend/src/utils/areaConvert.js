/**
 * Area unit conversion utilities.
 * Per DB-002: all areas stored as sqft internally.
 */
const TO_SQFT = {
  sqft: 1,
  sqyard: 9,       // 1 sq yard = 9 sqft
  sqmeter: 10.764, // 1 sq meter = 10.764 sqft
  sqm: 10.764,     // alias
  sqyd: 9,         // alias
  acre: 43560,
  hectare: 107639,
  // Indian units (Haryana standard)
  bigha: 26909,    // 1 bigha (Haryana) = 26,909.7 sqft (≈ 2500 sqm). Using 26909.
  biswa: 1345,     // 1 biswa = 1/20 bigha = 1345 sqft (Haryana)
  kanal: 5445,     // 1 kanal = 20 marla = 5445 sqft
  marla: 272.25,   // 1 marla = 272.25 sqft
  gaj: 9,          // 1 gaj = 1 sqyard = 9 sqft
  cent: 435.6,     // 1 cent = 1/100 acre
  guntha: 1089,    // 1 guntha = 1/40 acre
};

/**
 * Converts area from any unit to sqft.
 */
function toSqft(value, unit) {
  const factor = TO_SQFT[unit.toLowerCase()];
  if (!factor) throw new Error(`Unknown area unit: ${unit}`);
  return parseFloat((value * factor).toFixed(2));
}

/**
 * Converts sqft to any unit.
 */
function fromSqft(sqftValue, unit) {
  const factor = TO_SQFT[unit.toLowerCase()];
  if (!factor) throw new Error(`Unknown area unit: ${unit}`);
  return parseFloat((sqftValue / factor).toFixed(4));
}

/**
 * Returns human-readable area string.
 */
function formatArea(sqftValue, unit, decimals = 2) {
  const value = fromSqft(sqftValue, unit);
  return `${value.toFixed(decimals)} ${unit}`;
}

const SUPPORTED_UNITS = Object.keys(TO_SQFT);

module.exports = { toSqft, fromSqft, formatArea, TO_SQFT, SUPPORTED_UNITS };
