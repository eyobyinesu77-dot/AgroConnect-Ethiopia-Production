const Category = require('../models/Category');

// A fresh database has no categories at all, which would leave the Sell
// Crop form's Category dropdown empty and product creation permanently
// blocked until an admin manually adds some. Seeding these (only the ones
// genuinely missing, so this is safe to run against an existing database
// too — e.g. one seeded before "Oilseeds"/"Cash Crops" were added here)
// gives the app a sane starting point without pretending these are
// anything other than real, ordinary Category documents afterward — admin
// can rename, delete, or add to them exactly like any other category from
// that point on.
const DEFAULT_CATEGORIES = ['Cereals', 'Pulses', 'Oilseeds', 'Cash Crops', 'Vegetables', 'Fruits'];

const ensureDefaultCategories = async () => {
  const existing = await Category.find().select('name');
  const existingNames = new Set(existing.map((c) => c.name));
  const missing = DEFAULT_CATEGORIES.filter((name) => !existingNames.has(name));
  if (missing.length > 0) {
    await Category.insertMany(missing.map((name) => ({ name })));
  }
};

// GET /api/categories — public
const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/categories — admin only
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'name is required.' });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/categories/:id — admin only
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
