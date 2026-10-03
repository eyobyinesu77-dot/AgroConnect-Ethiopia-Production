const Product = require('../models/Product');
const Category = require('../models/Category');

// GET /api/products
// Supports ?category=Cereals, ?region=Oromia, ?listingStatus=Active filtering
// for the horizontal, category-grouped marketplace layout.
// By default, expired listings (expiryDate in the past) are excluded from
// the public marketplace — pass ?includeExpired=true to see them anyway
// (used by the farmer's own "My Products" view, not the public marketplace).
const getProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.region) filter.region = req.query.region;
    if (req.query.listingStatus) filter.listingStatus = req.query.listingStatus;

    if (req.query.includeExpired !== 'true') {
      filter.$or = [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }];
    }

    const products = await Product.find(filter)
      .populate('farmer', 'fullName phone region zone woreda')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id — a single product's full details, for the Product
// Details page (public marketplace and buyer dashboard both use this same
// endpoint — the page just renders inside a different layout shell
// depending on which route it was reached from).
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'fullName phone region zone woreda');
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/mine — the logged-in farmer's own listings (always includes expired ones, so they can manage them)
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products — farmer lists a crop for sale
const createProduct = async (req, res) => {
  try {
    const { name, category, variety, grade, unit, price, stock, expiryDate, region, zone, woreda, kebele, description, image } = req.body;

    if (!name || !category || !price || !stock || !region) {
      return res.status(400).json({ message: 'name, category, price, stock, and region are required.' });
    }
    const categoryExists = await Category.findOne({ name: category });
    if (!categoryExists) {
      return res.status(400).json({ message: `"${category}" is not a recognized category. Ask an admin to add it under Categories.` });
    }
    if (unit && !Product.UNITS.includes(unit)) {
      return res.status(400).json({ message: `unit must be one of: ${Product.UNITS.join(', ')}` });
    }
    if (grade && !Product.GRADES.includes(grade)) {
      return res.status(400).json({ message: `grade must be one of: ${Product.GRADES.join(', ')}` });
    }
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return res.status(400).json({ message: 'expiryDate cannot be in the past.' });
    }

    const product = await Product.create({
      name,
      category,
      variety: variety || undefined,
      grade: grade || 'Grade A',
      unit: unit || 'Quintal',
      listingStatus: Number(stock) > 0 ? 'Active' : 'Sold Out',
      price,
      stock,
      expiryDate: expiryDate || undefined,
      region,
      zone,
      woreda,
      kebele,
      description,
      image,
      farmer: req.user._id,
    });

    res.status(201).json({ message: 'Product listed successfully!', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/products/:id — farmer updates their own listing:
// restock, change price, change expiry date, or manually mark Sold Out.
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    if (req.user.role !== 'admin' && product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own products.' });
    }

    const { stock, price, expiryDate, listingStatus, variety, grade } = req.body;

    if (price !== undefined) {
      if (Number(price) <= 0) {
        return res.status(400).json({ message: 'price must be greater than 0.' });
      }
      product.price = price;
    }

    if (variety !== undefined) {
      product.variety = variety || undefined;
    }

    if (grade !== undefined) {
      if (!Product.GRADES.includes(grade)) {
        return res.status(400).json({ message: `grade must be one of: ${Product.GRADES.join(', ')}` });
      }
      product.grade = grade;
    }

    if (expiryDate !== undefined) {
      // Empty string / null clears the expiry date.
      product.expiryDate = expiryDate || undefined;
    }

    if (stock !== undefined) product.stock = stock;

    if (listingStatus && Product.LISTING_STATUSES.includes(listingStatus)) {
      product.listingStatus = listingStatus;
    } else if (stock !== undefined) {
      // Keep listingStatus honest with stock unless the caller explicitly overrode it above.
      product.listingStatus = product.stock > 0 ? 'Active' : 'Sold Out';
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id — only the owning farmer (or an admin) can delete a listing
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    if (req.user.role !== 'admin' && product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own products.' });
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, getMyProducts, createProduct, updateProduct, deleteProduct };
