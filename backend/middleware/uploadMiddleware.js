import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadsRoot = path.resolve(process.cwd(), 'backend', 'uploads', 'proofs');
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 50);

    cb(null, `${Date.now()}-${safeBaseName || 'proof'}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const proofUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
      return;
    }

    cb(null, true);
  },
});
