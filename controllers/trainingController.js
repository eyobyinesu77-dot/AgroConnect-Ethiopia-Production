const Training = require('../models/Training');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');

// POST /api/trainings — extension worker schedules a training session,
// either as an area-wide broadcast (region/zone, existing behavior) or
// targeted at specific farmers via targetFarmers (new).
const createTraining = async (req, res) => {
  try {
    const { title, description, date, location, zone, targetFarmers } = req.body;
    if (!title || !description || !date || !location) {
      return res.status(400).json({ message: 'title, description, date, and location are required.' });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Please provide a valid date.' });
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

    const training = await Training.create({
      extensionWorker: req.user._id,
      title,
      description,
      date: parsedDate,
      location,
      region: req.user.region,
      zone: zone || undefined,
      targetFarmers: validatedFarmerIds || undefined,
    });

    if (validatedFarmerIds) {
      validatedFarmerIds.forEach((id) => notifyUser(id, `🎓 New training scheduled: ${title}`));
    } else {
      const farmerFilter = { role: 'farmer', region: req.user.region };
      if (zone) farmerFilter.zone = zone;
      User.find(farmerFilter).select('_id').then((farmers) => {
        farmers.forEach((f) => notifyUser(f._id, `🎓 New training scheduled: ${title}`));
      }).catch((error) => console.error('Failed to notify farmers of training:', error.message));
    }

    res.status(201).json({ message: 'Training scheduled.', training });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/trainings/mine — extension worker's own scheduled trainings
const getMyTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({ extensionWorker: req.user._id })
      .populate('targetFarmers', 'fullName')
      .sort({ date: 1 });
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/trainings — farmer's view: trainings matching their region/zone
// broadcast, OR specifically targeted at them by name.
const getTrainingsForFarmer = async (req, res) => {
  try {
    const { region, zone } = req.user;
    console.log('[Farmer Trainings]', { farmerId: req.user._id?.toString(), region, zone });
    const trainings = await Training.find({
      $or: [
        {
          region,
          $or: [{ zone: { $exists: false } }, { zone: null }, { zone: '' }, { zone }],
        },
        { targetFarmers: req.user._id },
      ],
    })
      .populate('extensionWorker', 'fullName')
      .sort({ date: 1 })
      .limit(30);
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/trainings/:id — extension worker cancels their own training
const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training not found.' });
    }
    if (String(training.extensionWorker) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only cancel your own trainings.' });
    }
    await training.deleteOne();
    res.json({ message: 'Training cancelled.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTraining, getMyTrainings, getTrainingsForFarmer, deleteTraining };
