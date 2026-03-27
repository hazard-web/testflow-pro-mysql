// ─────────────────────────────────────────────
//  Cloudinary Storage Utility
//  Free tier: 25 credits/month (≈25 GB storage + transforms)
// ─────────────────────────────────────────────
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// ── CONFIGURE ────────────────────────────────
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const isCloudConfigured = () => !!(CLOUD_NAME && API_KEY && API_SECRET);

if (isCloudConfigured()) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  logger.info('☁️  Cloudinary configured');
}

// ── UPLOAD ───────────────────────────────────
/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer (from multer memoryStorage)
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type
 * @returns {{ publicId: string, url: string }} - Cloudinary public_id and secure URL
 */
const uploadToCloud = async (buffer, originalName, mimeType) => {
  if (!isCloudConfigured()) {
    throw new Error(
      'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    );
  }

  const isVideo = mimeType.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'testflow/attachments',
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error.message);
          return reject(error);
        }
        logger.info(`Uploaded to Cloudinary: ${result.public_id} (${mimeType})`);
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
        });
      }
    );
    stream.end(buffer);
  });
};

// ── DELETE ───────────────────────────────────
/**
 * Delete a file from Cloudinary.
 * @param {string} publicId - Cloudinary public_id
 * @param {string} [mimeType] - MIME type to determine resource_type
 */
const deleteFromCloud = async (publicId, mimeType) => {
  if (!isCloudConfigured()) {
    logger.warn('Cloudinary not configured, skipping delete');
    return;
  }

  try {
    const resourceType = mimeType && mimeType.startsWith('video/') ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`Deleted from Cloudinary: ${publicId}`);
  } catch (err) {
    logger.error(`Failed to delete from Cloudinary: ${publicId}`, err.message);
  }
};

module.exports = { uploadToCloud, deleteFromCloud, isCloudConfigured };
