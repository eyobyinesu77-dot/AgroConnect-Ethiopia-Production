const { upload } = require('../config/cloudinary');

const uploadMiddleware = upload.single('image');

// Used by the farmer loan application form: the crop-type photo travels in
// the same multipart/form-data request as the rest of the loan fields,
// under the field name `cropImage`, rather than a separate upload call.
const cropImageUploadMiddleware = upload.single('cropImage');

module.exports = uploadMiddleware;
module.exports.cropImageUploadMiddleware = cropImageUploadMiddleware;