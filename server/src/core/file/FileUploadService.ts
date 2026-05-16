import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class FileUploadService {
  static async uploadFromBuffer(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${buffer.toString('base64')}`,
        {
          folder,
          public_id: publicId,
          resource_type: 'auto',
        },
      );
      return result.secure_url;
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw error;
    }
  }

  static async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error('Cloudinary delete failed:', error);
    }
  }

  static getPublicIdFromUrl(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts[parts.length - 2];
    return `${folder}/${publicId}`;
  }
}