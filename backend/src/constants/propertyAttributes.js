/**
 * JSONB schema definitions per property type.
 * Per DB-001: type-specific attributes stored as jsonb `attributes` column.
 * These are used for validation and documentation — not enforced at DB level.
 */

const PROPERTY_TYPES = [
  'flat',
  'house',
  'plot',
  'commercial',
  'agricultural',
  'farmhouse',
  'pg',
  'warehouse',
  'shop',
  'office',
];

const ATTRIBUTE_SCHEMAS = {
  flat: {
    bhk: { type: 'integer', required: true },           // 1, 2, 3, 4, 5+
    floor: { type: 'integer', required: true },
    total_floors: { type: 'integer', required: true },
    furnished_status: { type: 'string', enum: ['unfurnished', 'semi', 'fully'] },
    facing: { type: 'string', enum: ['north', 'south', 'east', 'west', 'ne', 'nw', 'se', 'sw'] },
    bathrooms: { type: 'integer' },
    balconies: { type: 'integer' },
    parking: { type: 'string', enum: ['none', 'open', 'covered'] },
    lift: { type: 'boolean' },
    society_name: { type: 'string' },
    is_ddjay: { type: 'boolean' },           // DDJAY affordable housing scheme
    registry_status: { type: 'string', enum: ['registered', 'unregistered', 'under_process'] },
  },
  house: {
    bhk: { type: 'integer', required: true },
    floors: { type: 'integer' },
    facing: { type: 'string', enum: ['north', 'south', 'east', 'west', 'ne', 'nw', 'se', 'sw'] },
    bathrooms: { type: 'integer' },
    parking: { type: 'string', enum: ['none', 'open', 'covered'] },
    furnished_status: { type: 'string', enum: ['unfurnished', 'semi', 'fully'] },
    registry_status: { type: 'string', enum: ['registered', 'unregistered', 'under_process'] },
    is_lal_dora: { type: 'boolean' },        // Lal Dora property
  },
  plot: {
    facing: { type: 'string', enum: ['north', 'south', 'east', 'west', 'ne', 'nw', 'se', 'sw'] },
    corner_plot: { type: 'boolean' },
    plot_number: { type: 'string' },
    sector_block: { type: 'string' },
    registry_status: { type: 'string', enum: ['registered', 'unregistered', 'under_process'] },
    is_lal_dora: { type: 'boolean' },
    is_ddjay: { type: 'boolean' },
    is_approved: { type: 'boolean' },        // DTCP / HRERA approved
    approving_authority: { type: 'string' }, // DTCP, HRERA, MC, etc.
  },
  commercial: {
    commercial_type: { type: 'string', enum: ['shop', 'office', 'showroom', 'warehouse', 'industrial'] },
    floor: { type: 'integer' },
    total_floors: { type: 'integer' },
    frontage_ft: { type: 'number' },         // Road-facing width in feet
    registry_status: { type: 'string', enum: ['registered', 'unregistered', 'under_process'] },
  },
  agricultural: {
    land_type: { type: 'string', enum: ['farm', 'orchard', 'pond', 'mixed'] },
    soil_type: { type: 'string' },
    water_source: { type: 'string', enum: ['tubewell', 'canal', 'rain', 'none'] },
    is_collector_rate_area: { type: 'boolean' },
    dist_highway_km: { type: 'number' },
    khasra_number: { type: 'string' },
  },
  farmhouse: {
    bhk: { type: 'integer' },
    built_up_sqft: { type: 'number' },
    water_source: { type: 'string', enum: ['tubewell', 'canal', 'municipal', 'none'] },
    dist_highway_km: { type: 'number' },
  },
  pg: {
    pg_for: { type: 'string', enum: ['male', 'female', 'any'] },
    sharing_type: { type: 'string', enum: ['single', 'double', 'triple', 'dormitory'] },
    meals_included: { type: 'boolean' },
    attached_bathroom: { type: 'boolean' },
    ac: { type: 'boolean' },
  },
  warehouse: {
    height_ft: { type: 'number' },
    loading_docks: { type: 'integer' },
    power_kva: { type: 'number' },
    floor_strength: { type: 'string' },
  },
  shop: {
    floor: { type: 'integer' },
    frontage_ft: { type: 'number' },
    registry_status: { type: 'string', enum: ['registered', 'unregistered', 'under_process'] },
  },
  office: {
    floor: { type: 'integer' },
    total_floors: { type: 'integer' },
    cabins: { type: 'integer' },
    furnished_status: { type: 'string', enum: ['unfurnished', 'semi', 'fully'] },
    registry_status: { type: 'string', enum: ['registered', 'unregistered', 'under_process'] },
  },
};

module.exports = { PROPERTY_TYPES, ATTRIBUTE_SCHEMAS };
