const User = require('../models/User');
const Visit = require('../models/Visit');

// GET /api/extension/farmers — the farmers assigned to this extension
// worker by an Admin (see adminController.assignExtensionWorker). Before
// the assignedExtensionWorker field existed, this returned every farmer on
// the platform regardless of who — if anyone — was responsible for them;
// now it reflects the real assignment. Note: a farmer with no assignment
// yet won't show up for any extension worker until an admin assigns one.
const getFarmersList = async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer', assignedExtensionWorker: req.user._id })
      .select('fullName phone region zone woreda kebele')
      .sort({ fullName: 1 });
    res.json(farmers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/extension/visits — log a farm visit
const createVisit = async (req, res) => {
  try {
    const { farmerId, notes, visitDate } = req.body;
    if (!farmerId || !notes) {
      return res.status(400).json({ message: 'farmerId and notes are required.' });
    }

    const farmer = await User.findOne({ _id: farmerId, role: 'farmer' });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    const visit = await Visit.create({
      extensionWorker: req.user._id,
      farmer: farmerId,
      notes,
      visitDate: visitDate || Date.now(),
    });

    res.status(201).json({ message: 'Visit logged.', visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/extension/visits — the logged-in extension worker's own visit log
const getMyVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ extensionWorker: req.user._id })
      .populate('farmer', 'fullName phone region zone woreda')
      .sort({ visitDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/extension/visits/mine-as-farmer — a farmer's own visit history:
// visits logged against them by their extension worker(s). Reuses the same
// Visit model/collection as the extension worker's log above — no
// duplicate model, just the other side of the same "farmer" field.
const getVisitsForFarmer = async (req, res) => {
  try {
    const visits = await Visit.find({ farmer: req.user._id })
      .populate('extensionWorker', 'fullName phone')
      .sort({ visitDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFarmersList, createVisit, getMyVisits, getVisitsForFarmer };
