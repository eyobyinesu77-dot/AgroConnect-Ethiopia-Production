const mongoose = require('mongoose');
const TransportProvider = require('../models/TransportProvider');
const LogisticsRequest = require('../models/LogisticsRequest');
const AggregationBatch = require('../models/AggregationBatch');
const Notification = require('../models/Notification');
const { ETHIOPIAN_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');

const UNIT_TO_KG = { Quintal: 100, Kg: 1, Liter: 1 };
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------------------------------------------------------------------------
// Matching: rank available providers for a load between two regions.
// A provider must be available, serve the pickup region, and have enough
// capacity. Serving the destination region too ranks higher; among equals the
// tightest capacity fit wins (don't send a heavy truck for a small load).
// ---------------------------------------------------------------------------
const findMatchingProviders = async (pickupRegion, destinationRegion, quantityKg) => {
  const candidates = await TransportProvider.find({
    isAvailable: true,
    regionsServed: pickupRegion,
    capacityKg: { $gte: quantityKg },
  });

  return candidates
    .map((p) => {
      const servesDestination = p.regionsServed.includes(destinationRegion);
      return {
        provider: p,
        servesDestination,
        spareCapacityKg: p.capacityKg - quantityKg,
        score: (servesDestination ? 1000000 : 0) - (p.capacityKg - quantityKg),
      };
    })
    .sort((a, b) => b.score - a.score);
};

const notify = async (userId, message) => {
  try {
    await Notification.create({ user: userId, message });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// ============================ Provider directory ============================

// GET /api/transport-providers?region=&vehicleType=&available=true
const listProviders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.region) filter.regionsServed = req.query.region;
    if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
    if (req.query.available === 'true') filter.isAvailable = true;
    const providers = await TransportProvider.find(filter).sort({ name: 1 });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validateProviderBody = (body) => {
  const { name, vehicleType, capacityKg, regionsServed } = body;
  const phone = normalizePhone(body.phone);
  if (!name || !phone || !vehicleType || capacityKg === undefined) {
    return 'name, phone, vehicleType and capacityKg are required.';
  }
  if (!ETHIOPIAN_PHONE_REGEX.test(phone)) {
    return 'Enter a valid Ethiopian phone number (e.g. 0911223344).';
  }
  if (!TransportProvider.VEHICLE_TYPES.includes(vehicleType)) {
    return `vehicleType must be one of: ${TransportProvider.VEHICLE_TYPES.join(', ')}.`;
  }
  if (!(Number(capacityKg) > 0)) return 'capacityKg must be greater than 0.';
  if (!Array.isArray(regionsServed) || regionsServed.length === 0) {
    return 'Select at least one region served.';
  }
  return null;
};

// POST /api/transport-providers (admin)
const createProvider = async (req, res) => {
  try {
    const error = validateProviderBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const provider = await TransportProvider.create({
      name: req.body.name,
      phone: normalizePhone(req.body.phone),
      vehicleType: req.body.vehicleType,
      capacityKg: Number(req.body.capacityKg),
      regionsServed: req.body.regionsServed,
      ratePerQuintalPerKm: req.body.ratePerQuintalPerKm === '' ? undefined : req.body.ratePerQuintalPerKm,
      isAvailable: req.body.isAvailable !== false,
      notes: req.body.notes,
      createdBy: req.user._id,
    });
    res.status(201).json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/transport-providers/:id (admin)
const updateProvider = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid provider id.' });
    const error = validateProviderBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const provider = await TransportProvider.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: normalizePhone(req.body.phone),
        vehicleType: req.body.vehicleType,
        capacityKg: Number(req.body.capacityKg),
        regionsServed: req.body.regionsServed,
        ratePerQuintalPerKm: req.body.ratePerQuintalPerKm === '' ? undefined : req.body.ratePerQuintalPerKm,
        isAvailable: req.body.isAvailable !== false,
        notes: req.body.notes,
      },
      { new: true, runValidators: true }
    );
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/transport-providers/:id (admin) — blocked while the provider
// still has live (non-finished) work assigned.
const deleteProvider = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid provider id.' });
    const inUse = await LogisticsRequest.exists({
      assignedProvider: req.params.id,
      status: { $in: ['Assigned', 'In Transit'] },
    });
    if (inUse) {
      return res.status(400).json({ message: 'This provider has active jobs. Mark it unavailable instead of deleting.' });
    }
    const provider = await TransportProvider.findByIdAndDelete(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    res.json({ message: 'Provider deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================ Logistics requests ============================

// POST /api/logistics (farmer, buyer)
const createRequest = async (req, res) => {
  try {
    const { cropName, quantity, unit = 'Quintal', pickupRegion, pickupZone, pickupWoreda,
      destinationRegion, destinationAddress, preferredDate, notes, product } = req.body;

    if (!cropName || !quantity || !pickupRegion || !destinationRegion || !destinationAddress) {
      return res.status(400).json({
        message: 'cropName, quantity, pickupRegion, destinationRegion and destinationAddress are required.',
      });
    }
    if (!UNIT_TO_KG[unit]) return res.status(400).json({ message: 'Invalid unit.' });
    if (!(Number(quantity) > 0)) return res.status(400).json({ message: 'quantity must be greater than 0.' });
    if (preferredDate && new Date(preferredDate) < new Date(new Date().toDateString())) {
      return res.status(400).json({ message: 'Preferred date cannot be in the past.' });
    }
    if (product && !isValidId(product)) return res.status(400).json({ message: 'Invalid product id.' });

    const request = await LogisticsRequest.create({
      requester: req.user._id,
      product: product || undefined,
      cropName,
      quantity: Number(quantity),
      unit,
      quantityKg: Number(quantity) * UNIT_TO_KG[unit],
      pickupRegion,
      pickupZone,
      pickupWoreda,
      destinationRegion,
      destinationAddress,
      preferredDate: preferredDate || undefined,
      notes,
    });

    // Immediately show the requester which providers currently fit, so the
    // request is useful even before an admin acts on it.
    const matches = await findMatchingProviders(pickupRegion, destinationRegion, request.quantityKg);
    res.status(201).json({ request, matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/logistics/mine
const getMyRequests = async (req, res) => {
  try {
    const requests = await LogisticsRequest.find({ requester: req.user._id })
      .populate('assignedProvider', 'name phone vehicleType')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/logistics/:id/cancel (owner) — only while still Pending.
const cancelRequest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid request id.' });
    const request = await LogisticsRequest.findOne({ _id: req.params.id, requester: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: `A ${request.status} request can no longer be cancelled here. Contact the admin.` });
    }
    request.status = 'Cancelled';
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/logistics (admin)
const getAllRequests = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const requests = await LogisticsRequest.find(filter)
      .populate('requester', 'fullName email phone role')
      .populate('assignedProvider', 'name phone vehicleType')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/logistics/:id/matches (admin or the requester)
const getRequestMatches = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid request id.' });
    const request = await LogisticsRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (req.user.role !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed to view this request.' });
    }
    const matches = await findMatchingProviders(request.pickupRegion, request.destinationRegion, request.quantityKg);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/logistics/:id/assign  { providerId } (admin) — single request.
const assignProvider = async (req, res) => {
  try {
    const { providerId } = req.body;
    if (!isValidId(req.params.id) || !isValidId(providerId)) {
      return res.status(400).json({ message: 'Valid request id and providerId are required.' });
    }
    const request = await LogisticsRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: `Only Pending requests can be assigned (this one is ${request.status}).` });
    }
    const provider = await TransportProvider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    if (!provider.isAvailable) return res.status(400).json({ message: 'Provider is marked unavailable.' });
    if (provider.capacityKg < request.quantityKg) {
      return res.status(400).json({ message: 'Provider capacity is smaller than this load.' });
    }

    request.assignedProvider = provider._id;
    request.status = 'Assigned';
    await request.save();
    await notify(request.requester, `Transport assigned for your ${request.cropName} load: ${provider.name} (${provider.phone}).`);
    await request.populate('assignedProvider', 'name phone vehicleType');
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/logistics/:id/status  { status } (admin) — In Transit / Delivered.
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['In Transit', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'status must be "In Transit" or "Delivered".' });
    }
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid request id.' });
    const request = await LogisticsRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    const allowed = { 'In Transit': ['Assigned'], Delivered: ['In Transit'] };
    if (!allowed[status].includes(request.status)) {
      return res.status(400).json({ message: `Cannot move a ${request.status} request to ${status}.` });
    }
    request.status = status;
    await request.save();
    await notify(request.requester, `Your ${request.cropName} load is now: ${status}.`);
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================== Aggregation ================================

// GET /api/logistics/aggregation/suggestions (admin)
// Groups Pending requests by pickup+destination region. Only groups with 2+
// requests are worth aggregating; each comes with providers that can carry
// the combined load.
const getAggregationSuggestions = async (req, res) => {
  try {
    const groups = await LogisticsRequest.aggregate([
      { $match: { status: 'Pending' } },
      {
        $group: {
          _id: { pickupRegion: '$pickupRegion', destinationRegion: '$destinationRegion' },
          requestIds: { $push: '$_id' },
          totalQuantityKg: { $sum: '$quantityKg' },
          count: { $sum: 1 },
          crops: { $addToSet: '$cropName' },
        },
      },
      { $match: { count: { $gte: 2 } } },
      { $sort: { totalQuantityKg: -1 } },
    ]);

    const suggestions = await Promise.all(groups.map(async (g) => {
      const matches = await findMatchingProviders(g._id.pickupRegion, g._id.destinationRegion, g.totalQuantityKg);
      return {
        pickupRegion: g._id.pickupRegion,
        destinationRegion: g._id.destinationRegion,
        requestIds: g.requestIds,
        requestCount: g.count,
        totalQuantityKg: g.totalQuantityKg,
        crops: g.crops,
        matches,
      };
    }));

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/logistics/aggregation/batches  { requestIds, providerId? } (admin)
const createBatch = async (req, res) => {
  try {
    const { requestIds, providerId } = req.body;
    if (!Array.isArray(requestIds) || requestIds.length < 2 || !requestIds.every(isValidId)) {
      return res.status(400).json({ message: 'Select at least two valid requests to aggregate.' });
    }

    const requests = await LogisticsRequest.find({ _id: { $in: requestIds } });
    if (requests.length !== requestIds.length) {
      return res.status(404).json({ message: 'One or more requests were not found.' });
    }
    if (requests.some((r) => r.status !== 'Pending')) {
      return res.status(400).json({ message: 'Only Pending requests can be aggregated.' });
    }
    const { pickupRegion, destinationRegion } = requests[0];
    if (requests.some((r) => r.pickupRegion !== pickupRegion || r.destinationRegion !== destinationRegion)) {
      return res.status(400).json({ message: 'All requests in a batch must share the same pickup and destination region.' });
    }
    const totalQuantityKg = requests.reduce((sum, r) => sum + r.quantityKg, 0);

    let provider = null;
    if (providerId) {
      if (!isValidId(providerId)) return res.status(400).json({ message: 'Invalid providerId.' });
      provider = await TransportProvider.findById(providerId);
      if (!provider) return res.status(404).json({ message: 'Provider not found.' });
      if (!provider.isAvailable) return res.status(400).json({ message: 'Provider is marked unavailable.' });
      if (provider.capacityKg < totalQuantityKg) {
        return res.status(400).json({ message: `Provider capacity (${provider.capacityKg} kg) is below the combined load (${totalQuantityKg} kg).` });
      }
    }

    const batch = await AggregationBatch.create({
      pickupRegion,
      destinationRegion,
      requests: requests.map((r) => r._id),
      totalQuantityKg,
      provider: provider ? provider._id : undefined,
      status: provider ? 'Assigned' : 'Open',
      createdBy: req.user._id,
    });

    await LogisticsRequest.updateMany(
      { _id: { $in: requestIds } },
      provider
        ? { status: 'Assigned', batch: batch._id, assignedProvider: provider._id }
        : { status: 'Batched', batch: batch._id }
    );
    await Promise.all(requests.map((r) => notify(
      r.requester,
      provider
        ? `Your ${r.cropName} load was combined with others and assigned to ${provider.name} (${provider.phone}).`
        : `Your ${r.cropName} load was combined with other farmers' loads. A transport provider will be assigned soon.`
    )));

    res.status(201).json(await batch.populate('provider', 'name phone vehicleType'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/logistics/aggregation/batches (admin)
const getBatches = async (req, res) => {
  try {
    const batches = await AggregationBatch.find()
      .populate('provider', 'name phone vehicleType capacityKg')
      .populate({ path: 'requests', select: 'cropName quantity unit quantityKg status requester', populate: { path: 'requester', select: 'fullName phone' } })
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/logistics/aggregation/batches/:id/assign  { providerId } (admin)
const assignBatchProvider = async (req, res) => {
  try {
    const { providerId } = req.body;
    if (!isValidId(req.params.id) || !isValidId(providerId)) {
      return res.status(400).json({ message: 'Valid batch id and providerId are required.' });
    }
    const batch = await AggregationBatch.findById(req.params.id).populate('requests');
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.status !== 'Open') return res.status(400).json({ message: `Batch is already ${batch.status}.` });

    const provider = await TransportProvider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    if (!provider.isAvailable) return res.status(400).json({ message: 'Provider is marked unavailable.' });
    if (provider.capacityKg < batch.totalQuantityKg) {
      return res.status(400).json({ message: `Provider capacity (${provider.capacityKg} kg) is below the combined load (${batch.totalQuantityKg} kg).` });
    }

    batch.provider = provider._id;
    batch.status = 'Assigned';
    await batch.save();
    await LogisticsRequest.updateMany(
      { batch: batch._id, status: 'Batched' },
      { status: 'Assigned', assignedProvider: provider._id }
    );
    await Promise.all(batch.requests.map((r) => notify(
      r.requester,
      `Transport assigned for your ${r.cropName} load: ${provider.name} (${provider.phone}).`
    )));

    res.json(await batch.populate('provider', 'name phone vehicleType capacityKg'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listProviders, createProvider, updateProvider, deleteProvider,
  createRequest, getMyRequests, cancelRequest, getAllRequests,
  getRequestMatches, assignProvider, updateRequestStatus,
  getAggregationSuggestions, createBatch, getBatches, assignBatchProvider,
  findMatchingProviders,
};
