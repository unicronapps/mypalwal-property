# Build Progress

Last updated: [DATE]

## Phase 1 — Foundation
### Backend
- [x] Express app scaffold with folder structure
- [x] Supabase client setup
- [x] All DB migrations run (users, otp_tokens, device_tokens)
- [x] POST /api/auth/register
- [x] POST /api/auth/otp/send
- [x] POST /api/auth/otp/verify
- [x] POST /api/auth/login
- [x] POST /api/auth/refresh
- [x] POST /api/auth/logout
- [x] POST /api/auth/forgot-password
- [x] POST /api/auth/reset-password
- [x] POST /api/auth/google
- [x] JWT middleware (verifyToken, requireRole)
- [x] MSG91 OTP service wired

### Frontend
- [x] Next.js app scaffold with folder structure
- [x] Auth context + JWT storage strategy
- [x] /login page (S05)
- [x] /register page (S06)
- [x] /verify-otp page (S07)
- [x] /forgot-password page (S08)
- [x] Protected route wrapper component
- [x] Nav bar with role-aware links

## Phase 2 — Property Core
### Backend
- [x] DB migration 002 (properties, property_locations, property_media, property_amenities, property_views, cities, localities)
- [x] GET /api/properties (filter search + SEARCH-001 property_id shortcut)
- [x] POST /api/properties (create with area conversion + location + amenities)
- [x] GET /api/properties/:id (full detail, view dedup, contact masking)
- [x] PUT /api/properties/:id (owner update)
- [x] DELETE /api/properties/:id (soft delete)
- [x] GET /api/properties/my/listings
- [x] GET /api/properties/featured
- [x] GET /api/properties/attributes/:type
- [x] POST /api/media/presign
- [x] POST /api/media/confirm
- [x] DELETE /api/media/:id
- [x] PATCH /api/media/reorder
- [x] GET /api/search/suggest (autocomplete)
- [x] GET /api/search/property-id/:pid
- [x] GET /api/locations/cities
- [x] GET /api/locations/localities
- [x] areaConvert.js updated (Haryana bigha corrected)
- [x] propertyAttributes.js updated (all 12 types with labels)

### Auth rewrite
- [x] Phone+OTP only auth (removed password/Google)
- [x] POST /api/auth/otp/send (unified login+register)
- [x] POST /api/auth/otp/verify
- [x] POST /api/auth/complete-profile
- [x] Dummy OTP mode (9999999999 → 123456)

### Frontend
- [x] Home page (S01) with hero, SearchBar, type browse, featured/recent grids
- [x] Search results page (S02) with FilterPanel, pagination
- [x] Property detail page (S03) with gallery, contact card, enquiry modal
- [x] Multi-step Post Property form (S09-S13)
- [x] PropertyCard + skeleton components
- [x] SearchBar with autocomplete + property-ID detection
- [x] FilterPanel with all filters
- [x] lib/format.ts (Indian currency formatting)
- [x] Auth simplified to phone+OTP single page flow


## Phase 3 — User Dashboard
[add when Phase 2 complete]

## Phase 4 — Dealer Features
[add when Phase 3 complete]

## Phase 5 — Admin Panel
[add when Phase 4 complete]

## Phase 6 — Notifications + Polish
[add when Phase 5 complete]