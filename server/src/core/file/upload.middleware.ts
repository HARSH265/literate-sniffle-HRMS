import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const PHOTO_MAX_SIZE = 1 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const memoryStorage = multer.memoryStorage();

const logoFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (IMAGE_TYPES.includes(file.mimetype) && file.size <= LOGO_MAX_SIZE) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or size exceeds 2MB for logo'));
  }
};

export const uploadLogo = multer({
  storage: memoryStorage,
  fileFilter: logoFilter,
  limits: { fileSize: LOGO_MAX_SIZE },
});

const photoFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (IMAGE_TYPES.includes(file.mimetype) && file.size <= PHOTO_MAX_SIZE) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or size exceeds 1MB for photo'));
  }
};

export const uploadPhoto = multer({
  storage: memoryStorage,
  fileFilter: photoFilter,
  limits: { fileSize: PHOTO_MAX_SIZE },
});

const EXCEL_MAX_SIZE = 10 * 1024 * 1024;

const excelFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = file.originalname.toLowerCase();
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.xlsxm')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload a valid Excel file (.xlsx or .xls)'));
  }
};

export const upload = multer({
  storage: memoryStorage,
  fileFilter: excelFilter,
  limits: { fileSize: EXCEL_MAX_SIZE },
});

const DOC_MAX_SIZE = 5 * 1024 * 1024;
const DOC_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/x-pdf'];

const documentFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (DOC_ALLOWED_TYPES.includes(file.mimetype)) {
    if (file.size > DOC_MAX_SIZE) {
      cb(new Error('File size exceeds 5MB'));
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed'));
  }
};

export const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: { fileSize: DOC_MAX_SIZE },
});

const logosDir = path.join(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadSettingsLogo = multer({
  storage: diskStorage,
  fileFilter: logoFilter,
  limits: { fileSize: LOGO_MAX_SIZE },
});