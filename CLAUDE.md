# Project: Property Listing Platform (Tier 2 Cities — India)

## Stack
- Frontend: Next.js 14 (App Router) — deployed on Vercel
- Backend: Node.js + Express — separate instance on Railway/DigitalOcean
- Database: Supabase (PostgreSQL)
- Storage: AWS S3 (presigned URLs — client uploads directly, backend never handles bytes)
- SMS/OTP: MSG91 - use dummy auth for now. Use dummy number and dummy otp 
- Payments: Razorpay
- Push: Firebase Cloud Messaging (FCM)
- Auth: JWT (access token in memory, refresh token in httpOnly cookie) only phone number and OTP based auth.

## Roles
- admin: full access
- dealer: post property, boost, analytics, public profile, subscription plans
- user: post property (individual seller), enquire, view contact info

## Key Decisions (NEVER override these)
- Property type-specific attributes stored as JSONB column `attributes` on properties table
- Area always stored in sqft internally (area_sqft column). Display in user's chosen unit
- S3 presigned PUT URL — client uploads directly, then calls /api/media/confirm
- S3 and Cloudflare R2 use same API — only endpoint + credentials change in config
- Contact preference per listing: contact_call / contact_whatsapp / contact_enquiry booleans
- Enquiry sends WhatsApp to poster AND creates DB record with buyer name + phone
- Phone/WhatsApp only shown to logged-in users (no paywall)
- 5-char alphanumeric property_id (e.g. A3K9P) — unique, collision-checked on insert
- FCM device_tokens table exists for future React Native — platform field: web/ios/android
- Notifications written to DB first, then FCM push sent — both always happen together
- Supabase RLS enabled on all tables

## Region-specific fields (Haryana/NCR market)
- registry_status: registered / unregistered / under_process
- is_lal_dora (plots): boolean
- is_ddjay (flats + plots): boolean — DDJAY affordable housing scheme
- is_collector_rate_area (agricultural land): boolean
- dist_highway_km (agricultural land + farmhouse): numeric

## Current Phase
[UPDATE THIS AFTER EVERY PHASE]
Phase 2 — IN PROGRESS

## Repo Structure
[UPDATE THIS AS YOU BUILD]
/frontend — Next.js app
/backend — Node.js Express app