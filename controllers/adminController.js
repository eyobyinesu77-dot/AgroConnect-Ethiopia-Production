const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { EXTENSION_WORKER_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');

const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalFarmers, totalBuyers, totalExtensionWorkers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'extension' }),
    ]);

    res.json({ totalUsers, totalFarmers, totalBuyers, totalExtensionWorkers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsersByRole = (role) => async (req, res) => {
  try {
    let query = User.find({ role }).select('-password');
    if (role === 'farmer') {
      query = query.populate('assignedExtensionWorker', 'fullName phone');
    }
    const users = await query;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/farmers/:farmerId/assign-extension-worker
// Body: { extensionWorkerId } — pass null/omit to unassign.
const assignExtensionWorker = async (req, res) => {
  try {
    const { extensionWorkerId } = req.body;

    const farmer = await User.findOne({ _id: req.params.farmerId, role: 'farmer' });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    if (extensionWorkerId) {
      const worker = await User.findOne({ _id: extensionWorkerId, role: 'extension' });
      if (!worker) {
        return res.status(404).json({ message: 'Extension worker not found.' });
      }
      farmer.assignedExtensionWorker = extensionWorkerId;
    } else {
      farmer.assignedExtensionWorker = null;
    }

    await farmer.save();
    await farmer.populate('assignedExtensionWorker', 'fullName phone');

    res.json({
      message: extensionWorkerId ? 'Extension worker assigned.' : 'Extension worker unassigned.',
      farmer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-only: create an Extension Worker account.
// The worker is issued a temporary password and must change it on first login.
const createExtensionWorker = async (req, res) => {
  try {
    const { fullName, email, region, zone, woreda, kebele, temporaryPassword } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!fullName || !email || !region || !zone || !woreda) {
      return res.status(400).json({ message: 'fullName, email, region, zone, and woreda are required.' });
    }

    // Extension worker phone numbers must be exactly 10 digits, starting
    // with 07 or 09 — no +251 prefix, no spaces (see server/utils/phoneValidation.js
    // for why this is a separate, stricter rule from the general Ethiopian
    // phone regex used by Farmer/Buyer self-registration).
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
    if (!EXTENSION_WORKER_PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits starting with 07 or 09 (e.g. 0712345678).' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'This email is already registered!' });
    }

    const tempPassword = temporaryPassword || Math.random().toString(36).slice(-10);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const worker = await User.create({
      fullName,
      email,
      phone,
      region,
      zone,
      woreda,
      kebele,
      role: 'extension',
      password: hashedPassword,
      mustChangePassword: true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Extension worker created successfully.',
      user: {
        _id: worker._id,
        fullName: worker.fullName,
        email: worker.email,
        role: worker.role,
      },
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getFarmers: getUsersByRole('farmer'),
  getBuyers: getUsersByRole('buyer'),
  getExtensionWorkers: getUsersByRole('extension'),
  createExtensionWorker,
  assignExtensionWorker,
};
