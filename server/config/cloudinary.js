const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Real Cloudinary integration, gated behind env vars — same pattern as the
// WEATHER_API_KEY fallback in weatherController.js. If CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET aren't all set, uploads fall
// back to local disk storage instead of failing. Without this fallback,
// multer-storage-cloudinary still "succeeds" at construction time (it never
// validates credentials up front) but then throws Cloudinary's raw SDK error
// ("Must supply api_key") the moment someone actually uploads a file — which
// is exactly the confusing "API key" error surfaced to users in SellCrop and
// the loan application form.
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

if (hasCloudinaryConfig) {
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
} else {
  console.warn(
    '⚠️  CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not set in server/.env — ' +
    'image uploads will be stored locally under server/uploads instead of Cloudinary. ' +
    'Fine for local development/demo use, but set real Cloudinary credentials before deploying.'
  );

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      // Use only a safe extension derived from the original name; never trust path segments
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

module.exports = { cloudinary, upload, hasCloudinaryConfig };
