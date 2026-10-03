const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');
const { EXTENSION_WORKER_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    const { email, region, zone, woreda, kebele, temporaryPassword } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!email || !region || !zone || !woreda) {
      return res.status(400).json({ message: 'email, region, zone, and woreda are required.' });
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

// GET /api/admin/analytics — PRD-054 Analytics Dashboard.
// Computes the 6 metrics the PRD calls for from real data: registered users
// over time, active users, GMV, top crops, top regions, and USSD session
// counts. USSD/SMS is not built yet anywhere in this project (see the
// implementation report), so that metric is honestly reported as
// unavailable rather than faked with a random number.
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);

    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalExtensionWorkers,
      activeUsers,
      registeredUsersOverTime,
      gmvAgg,
      topCrops,
      topRegions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'extension' }),
      User.countDocuments({ lastLoginAt: { $gte: activeSince } }),

      // Registered users over time: weekly buckets for the last 12 weeks.
      User.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        {
          $group: {
            _id: { $dateTrunc: { date: '$createdAt', unit: 'week', startOfWeek: 'monday' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, weekStart: '$_id', count: 1 } },
      ]),

      // GMV: total value of successfully paid orders.
      Payment.aggregate([
        { $match: { status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Top crops by revenue: unwind order items, join to their product,
      // group by crop name.
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $lookup: {
            from: 'products',
            localField: 'orderItems.product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.name',
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
            unitsSold: { $sum: '$orderItems.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, crop: '$_id', revenue: 1, unitsSold: 1 } },
      ]),

      // Top regions by revenue: same shape, grouped by the product's region
      // (where the crop was grown/listed).
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $lookup: {
            from: 'products',
            localField: 'orderItems.product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.region',
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, region: '$_id', revenue: 1 } },
      ]),
    ]);

    res.json({
      generatedAt: now,
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalExtensionWorkers,
      activeUsers,
      activeUsersWindowDays: 30,
      gmv: gmvAgg[0]?.total || 0,
      registeredUsersOverTime,
      topCrops,
      topRegions,
      // USSD/SMS Market Price Board is not implemented in this project yet
      // (see README / implementation report), so there are no real USSD
      // sessions to count. Reported honestly as unavailable rather than 0
      // or a fabricated number, so the admin UI isn't misled.
      ussdSessionCount: null,
      ussdAvailable: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/analytics/export — CSV export of the weekly summary
// (PRD-054: "Exportable weekly summary").
const exportAnalyticsCsv = async (req, res) => {
  try {
    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

    const registeredUsersOverTime = await User.aggregate([
      { $match: { createdAt: { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: { $dateTrunc: { date: '$createdAt', unit: 'week', startOfWeek: 'monday' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const rows = [['Week Starting', 'New Registrations']];
    for (const row of registeredUsersOverTime) {
      rows.push([new Date(row._id).toISOString().slice(0, 10), row.count]);
    }
    const csv = rows.map((r) => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="agroconnect-weekly-summary-${now.toISOString().slice(0, 10)}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAnalytics,
  exportAnalyticsCsv,
  getFarmers: getUsersByRole('farmer'),
  getBuyers: getUsersByRole('buyer'),
  getExtensionWorkers: getUsersByRole('extension'),
  createExtensionWorker,
  assignExtensionWorker,
};
