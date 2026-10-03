const { hasCloudinaryConfig } = require('../config/cloudinary');

// Cloudinary storage already puts a hosted https URL in req.file.path.
// Local disk storage (the fallback used when Cloudinary env vars aren't
// set — see config/cloudinary.js) only gives a filesystem path, so build
// a URL the frontend can actually load, served via the static /uploads
// route registered in server.js.
const getUploadedFileUrl = (req) => {
  if (!req.file) return undefined;
  if (hasCloudinaryConfig) return req.file.path;
  return `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
};

module.exports = { getUploadedFileUrl };
