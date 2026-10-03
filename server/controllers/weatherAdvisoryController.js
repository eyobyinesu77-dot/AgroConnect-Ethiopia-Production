const WeatherAdvisory = require('../models/WeatherAdvisory');
const { notifyUser } = require('../utils/notify');
const User = require('../models/User');

// POST /api/weather-advisories — extension worker posts a weather advisory,
// either as an area broadcast (region/zone/woreda, existing behavior) or
// targeted at specific farmers via targetFarmers (new).
const createAdvisory = async (req, res) => {
  try {
    const { title, region, zone, woreda, condition, message, targetFarmers } = req.body;
    if (!title || !region || !condition || !message) {
      return res.status(400).json({ message: 'title, region, condition, and message are required.' });
    }

    let validatedFarmerIds;
    if (Array.isArray(targetFarmers) && targetFarmers.length > 0) {
      const assignedFarmers = await User.find({ role: 'farmer', assignedExtensionWorker: req.user._id }).select('_id');
      const assignedIds = new Set(assignedFarmers.map((f) => String(f._id)));
      const invalid = targetFarmers.filter((id) => !assignedIds.has(String(id)));
      if (invalid.length > 0) {
        return res.status(403).json({ message: 'You can only target farmers assigned to you.' });
      }
      validatedFarmerIds = targetFarmers;
    }

    const advisory = await WeatherAdvisory.create({
      extensionWorker: req.user._id,
      title,
      region,
      zone: zone || undefined,
      woreda: woreda || undefined,
      condition,
      message,
      targetFarmers: validatedFarmerIds || undefined,
    });

    // Best-effort: let affected farmers know a new advisory was posted.
    // Never let this block the response — see notify.js.
    if (validatedFarmerIds) {
      validatedFarmerIds.forEach((id) => notifyUser(id, `🌦️ New weather advisory for your area: ${title}`));
    } else {
      const farmerFilter = { role: 'farmer', region };
      if (zone) farmerFilter.zone = zone;
      if (woreda) farmerFilter.woreda = woreda;
      User.find(farmerFilter).select('_id').then((farmers) => {
        farmers.forEach((f) => notifyUser(f._id, `🌦️ New weather advisory for your area: ${title}`));
      }).catch((error) => console.error('Failed to notify farmers of advisory:', error.message));
    }

    res.status(201).json({ message: 'Advisory posted.', advisory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/weather-advisories/mine — extension worker's own posted advisories
const getMyAdvisories = async (req, res) => {
  try {
    const advisories = await WeatherAdvisory.find({ extensionWorker: req.user._id })
      .populate('targetFarmers', 'fullName')
      .sort({ createdAt: -1 });
    res.json(advisories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/weather-advisories — farmer's advisory feed: everything that
// matches their region/zone/woreda broadcast, OR was specifically targeted
// at them by name.
const getAdvisoriesForFarmer = async (req, res) => {
  try {
    const { region, zone, woreda } = req.user;
    const advisories = await WeatherAdvisory.find({
      $or: [
        {
          region,
          $and: [
            { $or: [{ zone: { $exists: false } }, { zone: null }, { zone: '' }, { zone }] },
            { $or: [{ woreda: { $exists: false } }, { woreda: null }, { woreda: '' }, { woreda }] },
          ],
        },
        { targetFarmers: req.user._id },
      ],
    })
      .populate('extensionWorker', 'fullName')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(advisories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/weather-advisories/:id — extension worker removes their own advisory
const deleteAdvisory = async (req, res) => {
  try {
    const advisory = await WeatherAdvisory.findById(req.params.id);
    if (!advisory) {
      return res.status(404).json({ message: 'Advisory not found.' });
    }
    if (String(advisory.extensionWorker) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own advisories.' });
    }
    await advisory.deleteOne();
    res.json({ message: 'Advisory deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAdvisory, getMyAdvisories, getAdvisoriesForFarmer, deleteAdvisory };
