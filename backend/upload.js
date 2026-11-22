import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(currentDir, process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const safeName = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40) || 'animal';
    callback(null, `${Date.now()}-${safeName}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const photoUpload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) return callback(new Error('Please upload a JPG, PNG, WEBP, or GIF image.'));
    callback(null, true);
  }
});
