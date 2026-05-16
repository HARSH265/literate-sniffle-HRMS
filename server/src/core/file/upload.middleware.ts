import multer from 'multer';
import { Request } from 'express';

const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const PHOTO_MAX_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const memoryStorage = multer.memoryStorage();

const logoFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype) && file.size <= LOGO_MAX_SIZE) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or size exceeds 2MB for logo'));
  }
};

const photoFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype) && file.size <= PHOTO_MAX_SIZE) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or size exceeds 1MB for photo'));
  }
};

export const uploadLogo = multer({
  storage: memoryStorage,
  fileFilter: logoFilter,
  limits: { fileSize: LOGO_MAX_SIZE },
});

export const uploadPhoto = multer({
  storage: memoryStorage,
  fileFilter: photoFilter,
  limits: { fileSize: PHOTO_MAX_SIZE },
});