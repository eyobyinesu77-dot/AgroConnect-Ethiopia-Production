const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Visit = require('../models/Visit');
const Report = require('../models/Report');

// GET /api/reports — admin: real sales analytics computed from Orders/Payments
const generateAdminReport = async (req, res) => {
  try {
    const [orders, payments, products] = await Promise.all([
      Order.find(),
      Payment.find({ status: 'Success' }),
      Product.countDocuments(),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const ordersByStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const data = {
      totalOrders: orders.length,
      totalRevenue,
      totalProducts: products,
      ordersByStatus,
    };

    // Save a snapshot so admins can look back at past reports later.
    const report = await Report.create({
      generatedBy: req.user._id,
      reportType: 'sales',
      data,
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/mine — past reports this admin has generated
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ generatedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/extension — extension worker: their own visit activity
const generateExtensionReport = async (req, res) => {
  try {
    const visits = await Visit.find({ extensionWorker: req.user._id });
    const uniqueFarmers = new Set(visits.map((v) => v.farmer.toString()));

    const data = {
      totalVisits: visits.length,
      farmersVisited: uniqueFarmers.size,
    };

    const report = await Report.create({
      generatedBy: req.user._id,
      reportType: 'extension-activity',
      data,
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateAdminReport, getMyReports, generateExtensionReport };
