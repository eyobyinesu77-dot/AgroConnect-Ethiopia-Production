const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Real Cloudinary integration, gated behind env vars. If CLOUDINARY_* aren't
// all set, uploads fall back to local disk under server/uploads.
// Cloudinary packages are only required when credentials are present so a
// missing/broken cloudinary install does not break local development.
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (jpg, png, webp, heic) and PDF are allowed.'), false);
  }
};

let storage;
let cloudinary = null;

if (hasCloudinaryConfig) {
  try {
    cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'agroconnect',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic', 'pdf'],
      },
    });
  } catch (err) {
    console.warn(
      '⚠️  Cloudinary packages failed to load (' + err.message + '). ' +
      'Falling back to local disk storage under server/uploads.'
    );
    cloudinary = null;
  }
}

if (!storage) {
  if (!hasCloudinaryConfig) {
    console.warn(
      '⚠️  CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not set in server/.env — ' +
      'image uploads will be stored locally under server/uploads instead of Cloudinary. ' +
      'Fine for local development/demo use, but set real Cloudinary credentials before deploying.'
    );
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter,
});

// Export whether Cloudinary is actually active (credentials + packages loaded)
const isCloudinaryActive = Boolean(hasCloudinaryConfig && cloudinary);

module.exports = { cloudinary, upload, hasCloudinaryConfig: isCloudinaryActive };
