const mongoose = require('mongoose');

const PRODUCT_UNITS = ['Quintal', 'Kg', 'Liter'];
const LISTING_STATUSES = ['Active', 'Sold Out'];
const PRODUCT_GRADES = ['Grade A', 'Grade B', 'Grade C'];

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // the specific crop/product, e.g. "Teff"
  // Category is intentionally NOT a fixed enum here — categories are real,
  // admin-managed documents in the Category collection (see
  // controllers/categoryController.js). productController validates this
  // value against that live collection instead of a hardcoded list, so
  // adding/removing a category in the admin UI actually takes effect
  // everywhere without a code change or redeploy.
  category: { type: String, required: true, trim: true },
  variety: { type: String, trim: true }, // local variety/cultivar name, e.g. "Quncho" for Teff — depends on `name`
  grade: { type: String, enum: PRODUCT_GRADES, default: 'Grade A' }, // quality grade, applies to any product
  unit: { type: String, enum: PRODUCT_UNITS, default: 'Quintal' },
  listingStatus: { type: String, enum: LISTING_STATUSES, default: 'Active' },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date }, // optional — when set, the listing is treated as unavailable past this date
  region: { type: String, required: true },
  zone: { type: String },
  woreda: { type: String },
  kebele: { type: String },
  description: { type: String },
  image: { type: String },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes to keep horizontal-marketplace queries (grouped by category, filtered by region) fast.
productSchema.index({ category: 1, listingStatus: 1 });
productSchema.index({ region: 1 });

productSchema.statics.UNITS = PRODUCT_UNITS;
productSchema.statics.LISTING_STATUSES = LISTING_STATUSES;
productSchema.statics.GRADES = PRODUCT_GRADES;

module.exports = mongoose.model('Product', productSchema);