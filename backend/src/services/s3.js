const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucket } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a presigned PUT URL for direct client upload.
 * Per MEDIA-001: client uploads directly, backend never handles bytes.
 * @param {string} folder - e.g. 'properties', 'avatars'
 * @param {string} extension - file extension without dot
 * @param {string} contentType - MIME type
 * @returns {Promise<{presignedUrl: string, s3Key: string, fileUrl: string}>}
 */
async function generatePresignedPutUrl(folder, extension, contentType) {
  const s3Key = `${folder}/${uuidv4()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  // Construct public file URL (assumes bucket is public or CDN in front)
  const baseUrl = process.env.S3_ENDPOINT
    ? `${process.env.S3_ENDPOINT}/${bucket}`
    : `https://${bucket}.s3.${process.env.S3_REGION || 'ap-south-1'}.amazonaws.com`;
  const fileUrl = `${baseUrl}/${s3Key}`;

  return { presignedUrl, s3Key, fileUrl };
}

module.exports = { generatePresignedPutUrl };
