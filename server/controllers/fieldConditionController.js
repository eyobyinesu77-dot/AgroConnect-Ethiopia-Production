const FieldCondition = require('../models/FieldCondition');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');

// POST /api/field-conditions — extension worker reports a condition for a specific farmer
const createFieldCondition = async (req, res) => {
  try {
    const { farmerId, conditionType, cropType, description, recommendation } = req.body;
    if (!farmerId || !conditionType || !description) {
      return res.status(400).json({ message: 'farmerId, conditionType, and description are required.' });
    }
    if (!['Crop Condition', 'Disease/Pest', 'Field Condition'].includes(conditionType)) {
      return res.status(400).json({ message: 'conditionType must be Crop Condition, Disease/Pest, or Field Condition.' });
    }

    const farmer = await User.findOne({ _id: farmerId, role: 'farmer' });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    const condition = await FieldCondition.create({
      extensionWorker: req.user._id,
      farmer: farmerId,
      conditionType,
      cropType: cropType || undefined,
      description,
      recommendation: recommendation || undefined,
    });

    notifyUser(farmerId, `🌾 New ${conditionType.toLowerCase()} report from your extension worker.`);

    res.status(201).json({ message: 'Condition report saved.', condition });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/field-conditions/:id — extension worker updates their own report
const updateFieldCondition = async (req, res) => {
  try {
    const condition = await FieldCondition.findById(req.params.id);
    if (!condition) {
      return res.status(404).json({ message: 'Condition report not found.' });
    }
    if (String(condition.extensionWorker) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only update your own condition reports.' });
    }

    const { conditionType, cropType, description, recommendation } = req.body;
    if (conditionType) {
      if (!['Crop Condition', 'Disease/Pest', 'Field Condition'].includes(conditionType)) {
        return res.status(400).json({ message: 'conditionType must be Crop Condition, Disease/Pest, or Field Condition.' });
      }
      condition.conditionType = conditionType;
    }
    if (cropType !== undefined) condition.cropType = cropType || undefined;
    if (description) condition.description = description;
    if (recommendation !== undefined) condition.recommendation = recommendation || undefined;

    await condition.save();
    notifyUser(condition.farmer, `🌾 Your extension worker updated a ${condition.conditionType.toLowerCase()} report.`);

    res.json({ message: 'Condition report updated.', condition });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/field-conditions/:id — extension worker removes their own report
const deleteFieldCondition = async (req, res) => {
  try {
    const condition = await FieldCondition.findById(req.params.id);
    if (!condition) {
      return res.status(404).json({ message: 'Condition report not found.' });
    }
    if (String(condition.extensionWorker) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own condition reports.' });
    }
    await condition.deleteOne();
    res.json({ message: 'Condition report deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/field-conditions/mine — extension worker's own filed reports
const getMyFieldConditions = async (req, res) => {
  try {
    const conditions = await FieldCondition.find({ extensionWorker: req.user._id })
      .populate('farmer', 'fullName phone')
      .sort({ createdAt: -1 });
    res.json(conditions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/field-conditions — farmer's own condition reports
const getFieldConditionsForFarmer = async (req, res) => {
  try {
    const conditions = await FieldCondition.find({ farmer: req.user._id })
      .populate('extensionWorker', 'fullName')
      .sort({ createdAt: -1 });
    res.json(conditions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFieldCondition,
  updateFieldCondition,
  deleteFieldCondition,
  getMyFieldConditions,
  getFieldConditionsForFarmer,
};
