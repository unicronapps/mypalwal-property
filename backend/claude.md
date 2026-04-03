only read the src/middleware.auth.js, src/routes/leads-find-property.js and index.js

now create the following routes

/*
 * BACKEND API REQUIRED:
 * POST /api/leads/find-property
 * Body (JSON):
 *   name          string    required
 *   phone         string    required  (10-digit Indian mobile)
 *   city          string    required
 *   requirement   string    required  free-text (what they're looking for)
 *   localities    string[]  optional  selected localities from the list
 *   otherLocality string    optional  free-text when user picks "Other"
 *   budgetMin     string    optional  e.g. "20L", "1Cr"
 *   budgetMax     string    optional  e.g. "50L", "2Cr"
 * Response: { success: true, id: <uuid> }
 * Auth: none (public endpoint)
 * Notes:
 *   - Store in a `property_request_leads` table
 *     (id, name, phone, city, requirement, localities, other_locality,
 *      budget_min, budget_max, created_at)
 *   - Send WhatsApp / notification to admin on new submission
 *   - Admin can then match with existing listings or assign to a dealer
 */