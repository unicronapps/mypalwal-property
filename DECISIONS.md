# Architecture Decisions Log

## DB-001: JSONB for property attributes
Type-specific fields (BHK, floor, bigha, soil type etc) stored as jsonb `attributes`
column on properties table. Schema per type defined in /backend/src/constants/propertyAttributes.js

## DB-002: Canonical area storage
All areas stored as sqft in `area_sqft` column regardless of input unit.
Conversion constants in /backend/src/utils/areaConvert.js

## AUTH-001: JWT strategy
Access token: short-lived (15 min), stored in memory (React context / Zustand)
Refresh token: 7 days, httpOnly cookie
Never store access token in localStorage

## MEDIA-001: S3 presigned upload
1. Frontend calls POST /api/media/presign → gets {presignedUrl, s3Key, fileUrl}
2. Frontend PUTs file directly to S3 using presignedUrl
3. Frontend calls POST /api/media/confirm with {s3Key, fileUrl, propertyId, mediaType}
4. Backend saves to property_media table
Moving to Cloudflare R2 later: change S3_ENDPOINT + S3_BUCKET in .env only

## NOTIF-001: Notification architecture
Write to notifications table first → then send FCM push
Never send FCM without DB record. Device tokens stored in device_tokens table.
Platform: web (now) / ios / android (React Native — future)

## SEARCH-001: Property ID instant match
If search query is exactly 5 chars alphanumeric, bypass full-text search
and do direct lookup on property_id column first.
```
