const User = require('../models/User');

// Fields a user is allowed to edit about themselves.
// role, email, password, mustChangePassword, createdBy are deliberately excluded —
// role/email changes and password changes go through their own dedicated,
// more carefully guarded endpoints (or aren't self-editable at all).
const EDITABLE_FIELDS = ['fullName', 'phone', 'region', 'zone', 'woreda', 'kebele', 'fayidaId', 'primaryCrop', 'farmSize', 'farmLocation'];

// GET /api/users/profile — the logged-in user's own profile
const getProfile = async (req, res) => {
  try {
    // req.user was already loaded (minus password) by the protect middleware.
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/profile — the logged-in user updates their own profile
const updateProfile = async (req, res) => {
  try {
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No editable fields were provided.' });
    }

    // fayidaId is unique+sparse. If a farmer's profile-completion form gets
    // resubmitted (e.g. a stale page reload) with the exact ID they already
    // have saved, there's nothing to write — drop it from the update so we
    // never ask Mongo to re-validate the unique index against a value that
    // is already this same document's own value.
    if (
      updates.fayidaId !== undefined &&
      req.user.fayidaId &&
      updates.fayidaId === req.user.fayidaId
    ) {
      delete updates.fayidaId;
    }

    if (Object.keys(updates).length === 0) {
      // Nothing left to change (e.g. the only field sent was an unchanged
      // fayidaId) — the profile is already in this state, so treat it as
      // a successful no-op rather than an error.
      return res.json(req.user);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(user);
  } catch (error) {
    // Mongo duplicate-key error (E11000) — in practice this means the
    // submitted Fayida ID is already registered to a *different* account.
    // Surface a clean, actionable message instead of a raw 500 with the
    // driver's internal error text.
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'value';
      const friendlyField = field === 'fayidaId' ? 'Fayida ID' : field;
      return res.status(409).json({
        message: `This ${friendlyField} is already registered to another account.`,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users — admin only: list every user
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/:id — admin only: edit any user (e.g. to correct their details)
const updateUser = async (req, res) => {
  try {
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'value';
      const friendlyField = field === 'fayidaId' ? 'Fayida ID' : field;
      return res.status(409).json({
        message: `This ${friendlyField} is already registered to another account.`,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getUsers, updateUser };
