// req.file is populated by multer via either the Cloudinary storage engine
// or the local-disk fallback (see middleware/uploadMiddleware.js and
// config/cloudinary.js) depending on whether Cloudinary env vars are set.
// getUploadedFileUrl() resolves the correct URL for whichever is active.
const { getUploadedFileUrl } = require('../utils/fileUrl');

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file was uploaded.' });
  }
  res.json({ message: 'File uploaded!', url: getUploadedFileUrl(req) });
};

module.exports = { uploadFile };
