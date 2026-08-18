const User = require('../models/User');
const Product = require('../models/Product');

// GET /api/wishlist — buyer's own wishlist, with product details populated
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'farmer', select: 'fullName' },
    });
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/wishlist/:productId — add a product to the buyer's wishlist
const addToWishlist = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const user = await User.findById(req.user._id);
    if (user.wishlist.some((id) => id.toString() === req.params.productId)) {
      return res.status(400).json({ message: 'Already in your wishlist.' });
    }

    user.wishlist.push(req.params.productId);
    await user.save();

    res.status(201).json({ message: 'Added to wishlist.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/wishlist/:productId — remove a product from the buyer's wishlist
const removeFromWishlist = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
    res.json({ message: 'Removed from wishlist.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
