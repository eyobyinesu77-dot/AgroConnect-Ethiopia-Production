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

    if (!name || !category || price === undefined || price === null || stock === undefined || stock === null) {
      return res.status(400).json({ message: 'name, category, price, stock, and region are required.' });
    }
    if (Number(price) <= 0 || Number.isNaN(Number(price))) {
      return res.status(400).json({ message: 'price must be greater than 0.' });
    }
    if (Number(stock) <= 0 || Number.isNaN(Number(stock))) {
      return res.status(400).json({ message: 'Quantity must be greater than 0.' });
    }
    if (!expiryDate) {
      return res.status(400).json({ message: 'Expiry date is required.' });
    }
    if (new Date(expiryDate) < new Date(new Date().toDateString())) {
      return res.status(400).json({ message: 'expiryDate cannot be in the past.' });
    }
    if (!image || !String(image).trim()) {
      return res.status(400).json({ message: 'A crop image is required.' });
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

    // Location authority: use the authenticated farmer's saved profile.
    // Do not trust a conflicting region from the client (e.g. Amhara farmer
    // submitting Oromia). Zone/woreda/kebele may come from the form only when
    // the farmer's profile region is set and matches; otherwise profile wins.
    const farmerRegion = req.user.region;
    const farmerZone = req.user.zone;
    const farmerWoreda = req.user.woreda;
    const farmerKebele = req.user.kebele;

    if (!farmerRegion) {
      return res.status(400).json({
        message: 'Complete your profile location (region) before listing a product.',
      });
    }

    const resolvedRegion = farmerRegion;
    // Prefer form zone/woreda/kebele only when the submitted region matches the
    // farmer profile (or was omitted). Otherwise force profile location.
    const clientRegionMatches =
      !region || String(region).trim() === String(farmerRegion).trim();
    const resolvedZone = clientRegionMatches && zone ? zone : (farmerZone || zone);
    const resolvedWoreda = clientRegionMatches && woreda ? woreda : (farmerWoreda || woreda);
    const resolvedKebele = clientRegionMatches && kebele ? kebele : (farmerKebele || kebele);

    if (!resolvedRegion) {
      return res.status(400).json({ message: 'name, category, price, stock, and region are required.' });
    }

    const stockNum = Number(stock);
    const product = await Product.create({
      name,
      category,
      variety: variety || undefined,
      grade: grade || 'Grade A',
      unit: unit || 'Quintal',
      listingStatus: stockNum > 0 ? 'Active' : 'Sold Out',
      price: Number(price),
      stock: stockNum,
      expiryDate,
      region: resolvedRegion,
      zone: resolvedZone || undefined,
      woreda: resolvedWoreda || undefined,
      kebele: resolvedKebele || undefined,
      description,
      image: String(image).trim(),
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
      // Expiry date is mandatory — reject empty/null clears on update.
      if (!expiryDate || (typeof expiryDate === 'string' && !expiryDate.trim())) {
        return res.status(400).json({ message: 'Expiry date is required.' });
      }
      if (new Date(expiryDate) < new Date(new Date().toDateString())) {
        return res.status(400).json({ message: 'expiryDate cannot be in the past.' });
      }
      product.expiryDate = expiryDate;
    }

    if (stock !== undefined) {
      const stockNum = Number(stock);
      if (Number.isNaN(stockNum) || stockNum <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0.' });
      }
      product.stock = stockNum;
    }

    if (req.body.image !== undefined && req.body.image && String(req.body.image).trim()) {
      product.image = String(req.body.image).trim();
    }

    // Derive listing status from stock + expiry. Expired products stay Sold Out
    // (unavailable) even if stock is increased. Explicit listingStatus is still
    // allowed but cannot force Active when stock is 0 or the product is expired.
    const isExpired = product.expiryDate && new Date(product.expiryDate) < new Date(new Date().toDateString());

    if (listingStatus && Product.LISTING_STATUSES.includes(listingStatus)) {
      if (listingStatus === 'Active') {
        if (product.stock <= 0) {
          return res.status(400).json({ message: 'Quantity must be greater than 0.' });
        }
        if (isExpired) {
          return res.status(400).json({ message: 'Cannot activate an expired product. Update the expiry date first.' });
        }
      }
      product.listingStatus = listingStatus;
    } else if (stock !== undefined) {
      if (product.stock > 0 && !isExpired) {
        product.listingStatus = 'Active';
      } else {
        product.listingStatus = 'Sold Out';
      }
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
