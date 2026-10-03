const Advice = require('../models/Advice');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');

// POST /api/advice — extension worker posts agricultural advice, either as
// an area-wide broadcast (region/zone, existing behavior) or targeted at
// specific farmers via targetFarmers (new — an array of farmer user IDs).
const createAdvice = async (req, res) => {
  try {
    const { title, content, cropType, zone, targetFarmers } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required.' });
    }

    let validatedFarmerIds;
    if (Array.isArray(targetFarmers) && targetFarmers.length > 0) {
      // Security: an extension worker may only target their own assigned
      // farmers, never an arbitrary ID supplied by the client.
      const assignedFarmers = await User.find({ role: 'farmer', assignedExtensionWorker: req.user._id }).select('_id');
      const assignedIds = new Set(assignedFarmers.map((f) => String(f._id)));
      const invalid = targetFarmers.filter((id) => !assignedIds.has(String(id)));
      if (invalid.length > 0) {
        return res.status(403).json({ message: 'You can only target farmers assigned to you.' });
      }
      validatedFarmerIds = targetFarmers;
    }

    const advice = await Advice.create({
      extensionWorker: req.user._id,
      title,
      content,
      cropType: cropType || undefined,
      region: req.user.region,
      zone: zone || undefined,
      targetFarmers: validatedFarmerIds || undefined,
    });

    // Notify specifically-targeted farmers if any were chosen, otherwise
    // fall back to the existing region/zone broadcast notification.
    if (validatedFarmerIds) {
      validatedFarmerIds.forEach((id) => notifyUser(id, `💡 New agricultural advice: ${title}`));
    } else {
      const farmerFilter = { role: 'farmer', region: req.user.region };
      if (zone) farmerFilter.zone = zone;
      User.find(farmerFilter).select('_id').then((farmers) => {
        farmers.forEach((f) => notifyUser(f._id, `💡 New agricultural advice: ${title}`));
      }).catch((error) => console.error('Failed to notify farmers of advice:', error.message));
    }

    res.status(201).json({ message: 'Advice posted.', advice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/advice/mine — extension worker's own posted advice
const getMyAdvice = async (req, res) => {
  try {
    const advice = await Advice.find({ extensionWorker: req.user._id })
      .populate('targetFarmers', 'fullName')
      .sort({ createdAt: -1 });
    res.json(advice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/advice — farmer's advice feed: everything that matches their
// region/zone broadcast, OR was specifically targeted at them by name.
const getAdviceForFarmer = async (req, res) => {
  try {
    const { region, zone } = req.user;
    console.log('[Farmer Advice]', { farmerId: req.user._id?.toString(), region, zone });
    const advice = await Advice.find({
      $or: [
        {
          region,
          $or: [{ zone: { $exists: false } }, { zone: null }, { zone: '' }, { zone }],
        },
        { targetFarmers: req.user._id },
      ],
    })
      .populate('extensionWorker', 'fullName')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(advice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/advice/:id — extension worker removes their own advice
const deleteAdvice = async (req, res) => {
  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) {
      return res.status(404).json({ message: 'Advice not found.' });
    }
    if (String(advice.extensionWorker) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own advice.' });
    }
    await advice.deleteOne();
    res.json({ message: 'Advice deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAdvice, getMyAdvice, getAdviceForFarmer, deleteAdvice };
