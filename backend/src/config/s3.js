const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  // Cloudflare R2 compatibility: set S3_ENDPOINT to override
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
});

module.exports = { s3Client, bucket: process.env.S3_BUCKET };
