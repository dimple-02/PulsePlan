import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
  secure: true,
});

export function isCloudinaryConfigured() {
  return Boolean(
    ENV.CLOUDINARY_CLOUD_NAME &&
    ENV.CLOUDINARY_API_KEY &&
    ENV.CLOUDINARY_API_SECRET
  );
}

/**
 * Uploads a file buffer to Cloudinary or falls back to local data URI in development.
 */
export async function uploadAttachmentStream(fileBuffer, { originalName, mimeType }) {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'pulseplan/attachments',
          resource_type: 'auto',
          filename_override: originalName,
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: originalName,
            fileType: mimeType || result.format,
            fileSize: result.bytes,
            uploadedAt: new Date(),
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // Development Fallback: Store as Data URI with simulated publicId
  console.log(`[Cloudinary Fallback] Cloudinary credentials not configured in .env. Using development Data URI for '${originalName}'.`);
  const base64Data = fileBuffer.toString('base64');
  const dataUrl = `data:${mimeType || 'application/octet-stream'};base64,${base64Data}`;

  return {
    url: dataUrl,
    publicId: 'simulated-' + Date.now(),
    fileName: originalName,
    fileType: mimeType || 'application/octet-stream',
    fileSize: fileBuffer.length,
    uploadedAt: new Date(),
  };
}

/**
 * Removes an attachment from Cloudinary by its publicId.
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId || publicId.startsWith('simulated-')) {
    return { result: 'ok' };
  }

  if (isCloudinaryConfigured()) {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('[Cloudinary Delete Error]:', err.message);
      return { error: err.message };
    }
  }

  return { result: 'ok' };
}
