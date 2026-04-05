const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  // 1. R2 requires the region to be 'auto'. Do not use ap-south-1.
  region: 'auto', 
  
  // 2. Ensure your .env S3_ENDPOINT is: https://<account_id>.r2.cloudflarestorage.com
  endpoint: process.env.S3_ENDPOINT, 
  
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  
  // 3. CRITICAL: Prevents the SDK from making the bucket name a subdomain
  forcePathStyle: true, 
  
  // 4. CRITICAL: Prevents the "AAAAAA==" checksum error in presigned URLs
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

module.exports = { 
  s3Client, 
  bucket: process.env.S3_BUCKET 
};