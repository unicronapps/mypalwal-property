# Build Progress

Last updated: 2026-03-20

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
### Database
- [x] Migration 003_activity.sql (enquiries, notifications, reports tables)

### Backend — Users routes (/api/users)
- [x] GET /api/users/me (profile + listing count + enquiry stats)
- [x] PUT /api/users/me (update name, agency_name, bio)
- [x] DELETE /api/users/me (soft delete — ban + null PII + deactivate listings)
- [x] POST /api/users/me/avatar (presign S3 upload for avatar)
- [x] PUT /api/users/me/password (no-op — OTP-only auth)
- [x] GET /api/users/:id/profile (public dealer profile, 404 if role=user)
- [x] POST /api/users/me/device-token (upsert FCM token with platform)

### Backend — Enquiries routes (/api/enquiries)
- [x] POST /api/enquiries (rate limit 2/property/24h, copy buyer info, WhatsApp notification, DB notification)
- [x] GET /api/enquiries/received (paginated, newest first, join property title + thumbnail)
- [x] GET /api/enquiries/sent (paginated, join property info + location)
- [x] PATCH /api/enquiries/:id/status (owner only — new/replied/closed)
- [x] GET /api/enquiries/contact/:propertyId (phone, whatsapp, canEnquire)
- [x] GET /api/enquiries/received/stats (group by property, counts by status)

### Backend — Visits routes (/api/visits)
- [x] GET /api/visits/mine (distinct properties visited, latest visit, paginated)
- [x] GET /api/visits/property/:id (daily view counts for chart, owner only)
- [x] GET /api/visits/dealer/summary (total views, recent 7d views, top listing)

### Frontend — Dashboard
- [x] Dashboard layout with sidebar nav + mobile hamburger drawer
- [x] Navbar updated with Dashboard link
- [x] Dashboard home page (S14) — stats row, recent listings, recent leads, recently viewed
- [x] My Listings page (S15) — status tabs, edit/sold/delete/boost actions, delete confirm modal, pagination
- [x] Edit Property page (S16) — 5-step form pre-filled, PATCH on save
- [x] Leads Received page (S17) — filter tabs, WhatsApp/call buttons, mark replied/closed
- [x] Enquiries Sent page (S18) — sent enquiries with re-enquire link
- [x] Visit History page (S19) — grid of visited properties with viewed_at
- [x] Account Settings page (S21) — avatar upload, profile edit, delete account with "type DELETE" confirmation

## Phase 4 — Dealer Features
### Database
- [x] Migration 004_payments.sql (plans, subscriptions, boosts, payments tables)
- [x] Seed plans table (Free/Basic/Pro/Unlimited)
- [x] Add is_boosted + boost_expires_at columns to properties

### Backend — Payments routes (/api/payments)
- [x] GET /api/payments/plans (all active plans)
- [x] GET /api/payments/subscription/status (active sub + listings used vs limit)
- [x] POST /api/payments/order (create Razorpay order — subscription or boost)
- [x] POST /api/payments/verify (verify Razorpay signature, activate sub/boost)
- [x] POST /api/payments/webhook (payment.failed, refund.created events)
- [x] GET /api/payments/history (paginated payment history)

### Backend — Subscription enforcement
- [x] POST /api/properties checks listing limit before creating (403 LISTING_LIMIT_REACHED)
- [x] GET /api/users/me includes active subscription + listing_limit

### Backend — Dealer analytics (visits routes)
- [x] GET /api/visits/property/:id returns daily view counts for chart
- [x] GET /api/visits/dealer/summary returns total views, 7d views, top listing

### Frontend — Dashboard (Dealer)
- [x] Dashboard layout updated with dealer nav section (role-aware)
- [x] Dealer Dashboard page (S22) — stats, subscription card, performance table, quick actions
- [x] Analytics page (S23) — property selector, CSS bar chart (no external deps), range toggle, stats cards, comparison table
- [x] Boost Listing page (S24) — listing selector, 3 boost packs, Razorpay checkout integration
- [x] Subscription Plans page (S25) — current plan banner, 4 plan cards, Razorpay upgrade flow, payment history table

### Frontend — Public Dealer Profile
- [x] /dealer/[id] page (S04) — SSR, dealer info + verified badge, listings grid

## Phase 5 — Admin Panel
### Backend
- [x] GET /api/admin/stats (user counts, property counts by status, monthly revenue, active boosts)
- [x] GET /api/admin/properties (all listings, search/filter, status filter, pagination)
- [x] PATCH /api/admin/properties/:id/approve (set active, notify owner)
- [x] PATCH /api/admin/properties/:id/reject (set deleted, reason, notify owner)
- [x] PATCH /api/admin/properties/:id/verify (toggle is_verified_property)
- [x] GET /api/admin/users (search by name/phone/email, role filter, pagination)
- [x] PATCH /api/admin/users/:id/ban (toggle ban, deactivate listings on ban)
- [x] PATCH /api/admin/users/:id/role (change between user/dealer, never admin)
- [x] PATCH /api/admin/dealers/:id/verify (toggle is_verified_dealer)
- [x] GET /api/admin/reports (join properties + users, status filter, pagination)
- [x] PATCH /api/admin/reports/:id (dismiss / remove listing / ban poster — transactional)
- [x] GET /api/admin/payments (all payments joined with users, revenue metrics)
- [x] POST /api/admin/boost/grant (admin-granted free boost, transactional)
- [x] GET /api/admin/analytics (listings by type/city/month, enquiries by month, top viewed, user growth)

### Frontend
- [x] Admin layout with dark sidebar nav (/app/admin/layout.tsx)
- [x] Admin Dashboard page (S26) — stat cards, recent listings/users/payments (/app/admin/page.tsx)
- [x] Manage Listings page (S27) — table, status tabs, search, bulk actions, approve/reject/verify/delete (/app/admin/listings/page.tsx)
- [x] Manage Users page (S28) — table, role tabs, search, ban/unban modal, role dropdown (/app/admin/users/page.tsx)
- [x] Manage Dealers page (S29) — dealer table, verified toggle, ban, profile link (/app/admin/dealers/page.tsx)
- [x] Reported Listings page (S30) — cards, status tabs, dismiss/remove/ban actions (/app/admin/reports/page.tsx)
- [x] Payments page (S31) — revenue cards, payments table, grant boost modal (/app/admin/payments/page.tsx)
- [x] Analytics page (S32) — recharts donut/bar/line charts, top viewed table, top cities table (/app/admin/analytics/page.tsx)
- [x] Navbar already has admin link (role-aware)

### Files created/modified
- backend/src/routes/admin.js (rewritten — 14 endpoints)
- frontend/app/admin/layout.tsx
- frontend/app/admin/page.tsx
- frontend/app/admin/listings/page.tsx
- frontend/app/admin/users/page.tsx
- frontend/app/admin/dealers/page.tsx
- frontend/app/admin/reports/page.tsx
- frontend/app/admin/payments/page.tsx
- frontend/app/admin/analytics/page.tsx
- frontend/package.json (added recharts)

## Phase 6 — Notifications + Polish
[add when Phase 5 complete]