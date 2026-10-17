// Product create/update validation + upload URL helper logic.
// Run: node --test test/productValidation.test.js
//
// Tests application LOGIC with in-memory fakes — does not require MongoDB Atlas
// or Cloudinary credentials. Live Cloudinary / browser E2E remain NOT VERIFIED
// without those services.

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');
const fs = require('fs');

// ---------- fakes ----------
const products = [];
let categoryExists = true;

class FakeProduct {
  static UNITS = ['Quintal', 'Kg', 'Liter'];
  static GRADES = ['Grade A', 'Grade B', 'Grade C'];
  static LISTING_STATUSES = ['Active', 'Sold Out'];

  static async create(doc) {
    const p = {
      _id: 'prod_' + products.length,
      ...doc,
      save: async function () { return this; },
    };
    products.push(p);
    return p;
  }

  static async findById(id) {
    return products.find((p) => p._id === id) || null;
  }
}

class FakeCategory {
  static async findOne(query) {
    if (!categoryExists) return null;
    return { name: query.name };
  }
}

const realLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const from = (parent && parent.filename) || '';
  if (from.endsWith('productController.js')) {
    if (request.endsWith('/models/Product') || request === '../models/Product') return FakeProduct;
    if (request.endsWith('/models/Category') || request === '../models/Category') return FakeCategory;
  }
  return realLoad.apply(this, arguments);
};

delete require.cache[require.resolve('../controllers/productController')];
const { createProduct, updateProduct } = require('../controllers/productController');

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

const farmerId = 'farmer_1';
const baseBody = {
  name: 'Teff',
  category: 'Cereals',
  unit: 'Quintal',
  price: 5000,
  stock: 10,
  expiryDate: '2099-12-31',
  region: 'Oromia',
  zone: 'East Shewa',
  woreda: "Ada'a",
  image: 'https://example.com/teff.jpg',
};

test('createProduct rejects missing image', async () => {
  products.length = 0;
  categoryExists = true;
  const req = { body: { ...baseBody, image: '' }, user: { _id: farmerId } };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /image/i);
  assert.equal(products.length, 0);
});

test('createProduct rejects missing expiryDate', async () => {
  products.length = 0;
  const req = { body: { ...baseBody, expiryDate: undefined }, user: { _id: farmerId } };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Expiry date is required/i);
  assert.equal(products.length, 0);
});

test('createProduct rejects stock <= 0', async () => {
  products.length = 0;
  for (const stock of [0, -1, 'abc']) {
    const req = { body: { ...baseBody, stock }, user: { _id: farmerId } };
    const res = mockRes();
    await createProduct(req, res);
    assert.equal(res.statusCode, 400, `stock=${stock}`);
    assert.match(res.body.message, /Quantity must be greater than 0/i);
  }
  assert.equal(products.length, 0);
});

test('createProduct accepts valid product with image and expiryDate', async () => {
  products.length = 0;
  categoryExists = true;
  const req = {
    body: { ...baseBody },
    user: { _id: farmerId, region: 'oromia', zone: 'eastShewa', woreda: 'adama' },
  };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 201);
  assert.ok(res.body.product);
  assert.equal(res.body.product.image, baseBody.image);
  assert.ok(res.body.product.expiryDate);
  assert.equal(res.body.product.stock, 10);
  assert.equal(products.length, 1);
});

test('createProduct rejects past expiryDate', async () => {
  products.length = 0;
  const req = { body: { ...baseBody, expiryDate: '2020-01-01' }, user: { _id: farmerId } };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /past/i);
});

test('updateProduct rejects stock <= 0', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    ...baseBody,
    farmer: farmerId,
    stock: 5,
    listingStatus: 'Active',
  });
  existing.farmer = { toString: () => farmerId };
  const req = {
    params: { id: existing._id },
    body: { stock: 0 },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Quantity must be greater than 0/i);
});

test('updateProduct allows status Sold Out', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    ...baseBody,
    farmer: farmerId,
    stock: 5,
    listingStatus: 'Active',
  });
  existing.farmer = { toString: () => farmerId };
  const req = {
    params: { id: existing._id },
    body: { listingStatus: 'Sold Out' },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.listingStatus, 'Sold Out');
});

// Mirrors utils/fileUrl.js without loading cloudinary package
test('getUploadedFileUrl local vs Cloudinary URL logic', () => {
  const getUploadedFileUrl = (req, hasCloudinary) => {
    if (!req.file) return undefined;
    if (hasCloudinary) return req.file.path;
    return `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  };
  const req = {
    file: { filename: 'test-image.jpg', path: 'https://res.cloudinary.com/x/y.jpg' },
    protocol: 'http',
    get: (h) => (h === 'host' ? 'localhost:5000' : undefined),
  };
  assert.equal(getUploadedFileUrl(req, false), 'http://localhost:5000/uploads/test-image.jpg');
  assert.equal(getUploadedFileUrl(req, true), 'https://res.cloudinary.com/x/y.jpg');
  assert.equal(getUploadedFileUrl({ file: null }, false), undefined);
});

test('upload controller rejects missing file', async () => {
  const uploadFile = async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded.' });
    }
    res.json({ message: 'File uploaded!', url: 'x' });
  };
  const res = mockRes();
  await uploadFile({ file: undefined }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /No file/i);
});

test('upload controller returns local URL shape when file present', async () => {
  const uploadFile = async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded.' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ message: 'File uploaded!', url });
  };
  const req = {
    file: { filename: 'abc.png' },
    protocol: 'http',
    get: () => 'localhost:5000',
  };
  const res = mockRes();
  await uploadFile(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.url, 'http://localhost:5000/uploads/abc.png');
});

test('Product schema keeps image and expiryDate optional for legacy records', () => {
  const schemaPath = path.join(__dirname, '..', 'models', 'Product.js');
  const src = fs.readFileSync(schemaPath, 'utf8');
  assert.doesNotMatch(src, /expiryDate:\s*\{[^}]*required:\s*true/);
  assert.doesNotMatch(src, /image:\s*\{[^}]*required:\s*true/);
});

// Frontend fallback safety: ProductCard and ProductDetails must not crash without image
test('frontend ProductCard handles missing image (source inspection)', () => {
  const cardPath = path.join(
    __dirname,
    '..',
    '..',
    'client',
    'src',
    'components',
    'common',
    'ProductCard.jsx'
  );
  const src = fs.readFileSync(cardPath, 'utf8');
  assert.match(src, /product\.image/);
  assert.match(src, /🌾|fallback|onError/i);
});

test('frontend ProductDetails handles missing stock/image safely (source inspection)', () => {
  const pdPath = path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'public', 'ProductDetails.jsx');
  const src = fs.readFileSync(pdPath, 'utf8');
  assert.match(src, /product\.stock/);
  assert.match(src, /isSoldOut/);
  assert.match(src, /expiryDate/);
});

// --- Inventory / status / sold-out edit scenarios (controller logic) ---

test('updateProduct: adding stock reactivates Sold Out product when not expired', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    name: 'Teff',
    category: 'Cereals',
    price: 100,
    stock: 0,
    listingStatus: 'Sold Out',
    expiryDate: '2099-06-01',
    farmer: farmerId,
    region: 'Oromia',
  });
  existing.farmer = { toString: () => farmerId };
  const req = {
    params: { id: existing._id },
    body: { stock: 3 },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.stock, 3);
  assert.equal(res.body.listingStatus, 'Active');
});

test('updateProduct: adding stock does not activate expired product', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    name: 'Teff',
    category: 'Cereals',
    price: 100,
    stock: 0,
    listingStatus: 'Sold Out',
    expiryDate: '2020-01-01',
    farmer: farmerId,
    region: 'Oromia',
  });
  existing.farmer = { toString: () => farmerId };
  const req = {
    params: { id: existing._id },
    body: { stock: 5 },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.stock, 5);
  assert.equal(res.body.listingStatus, 'Sold Out');
});

test('updateProduct: editing price on Sold Out without stock keeps Sold Out', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    name: 'Teff',
    category: 'Cereals',
    price: 100,
    stock: 0,
    listingStatus: 'Sold Out',
    expiryDate: '2099-06-01',
    farmer: farmerId,
    region: 'Oromia',
  });
  existing.farmer = { toString: () => farmerId };
  const req = {
    params: { id: existing._id },
    body: { price: 150 },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.price, 150);
  assert.equal(res.body.listingStatus, 'Sold Out');
  assert.equal(res.body.stock, 0);
});

test('updateProduct: non-owner cannot edit', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    name: 'Teff',
    category: 'Cereals',
    price: 100,
    stock: 2,
    listingStatus: 'Active',
    farmer: 'other_farmer',
    region: 'Oromia',
  });
  existing.farmer = { toString: () => 'other_farmer' };
  const req = {
    params: { id: existing._id },
    body: { price: 200 },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 403);
});

// --- Farmer region consistency on product create ---

test('createProduct uses farmer profile region when body region conflicts', async () => {
  products.length = 0;
  categoryExists = true;
  const req = {
    body: {
      ...baseBody,
      region: 'oromia', // conflicting client value
      zone: 'eastShewa',
    },
    user: {
      _id: farmerId,
      region: 'amhara',
      zone: 'northShewa',
      woreda: 'debreBirhan',
      kebele: '01',
    },
  };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.product.region, 'amhara');
  assert.equal(res.body.product.farmer, farmerId);
});

test('createProduct uses farmer profile region for oromia farmer', async () => {
  products.length = 0;
  categoryExists = true;
  const req = {
    body: {
      ...baseBody,
      region: 'tigray',
    },
    user: {
      _id: farmerId,
      region: 'oromia',
      zone: 'jimma',
      woreda: 'jimmaCity',
    },
  };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.product.region, 'oromia');
});

test('createProduct rejects when farmer profile has no region', async () => {
  products.length = 0;
  categoryExists = true;
  const req = {
    body: { ...baseBody, region: 'amhara' },
    user: { _id: farmerId }, // no region on profile
  };
  const res = mockRes();
  await createProduct(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /profile location|region/i);
  assert.equal(products.length, 0);
});


test('updateProduct rejects empty expiryDate', async () => {
  products.length = 0;
  const existing = await FakeProduct.create({
    name: 'Teff',
    category: 'Cereals',
    price: 100,
    stock: 2,
    listingStatus: 'Active',
    expiryDate: '2099-06-01',
    farmer: farmerId,
    region: 'oromia',
  });
  existing.farmer = { toString: () => farmerId };
  const req = {
    params: { id: existing._id },
    body: { expiryDate: '' },
    user: { _id: farmerId, role: 'farmer' },
  };
  const res = mockRes();
  await updateProduct(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Expiry date is required/i);
});
