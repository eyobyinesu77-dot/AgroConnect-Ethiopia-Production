const mongoose = require('mongoose');
const TransportProvider = require('../models/TransportProvider');
const LogisticsRequest = require('../models/LogisticsRequest');
const AggregationBatch = require('../models/AggregationBatch');
const TransportAllocation = require('../models/TransportAllocation');
const Notification = require('../models/Notification');
const { ETHIOPIAN_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');

const UNIT_TO_KG = { Quintal: 100, Kg: 1, Liter: 1 };
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ACTIVE_ALLOCATION_STATUSES = ['Assigned', 'In Transit'];

// Count active allocations and legacy assignments that have no allocation
// record. The latter prevents older direct assignments from freeing capacity.
const getProviderActiveLoadKg = async (providerId, session) => {
  const allocationQuery = TransportAllocation.find({
    provider: providerId,
    status: { $in: ACTIVE_ALLOCATION_STATUSES },
  }).select('totalQuantityKg');

  if (session) allocationQuery.session(session);
  const allocations = await allocationQuery;
  let activeLoadKg = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.totalQuantityKg || 0),
    0
  );

  const legacyQuery = LogisticsRequest.find({
    assignedProvider: providerId,
    status: { $in: ACTIVE_ALLOCATION_STATUSES },
  }).select('_id quantityKg');

  if (session) legacyQuery.session(session);
  const legacyRequests = await legacyQuery;

  if (legacyRequests.length) {
    const requestIds = legacyRequests.map((request) => request._id);
    // Only active allocations for this same provider cover legacy requests.
    // Delivered/cancelled allocations and allocations for other providers
    // must not hide a legacy assignment from this provider's active load.
    const linkedQuery = TransportAllocation.find({
      provider: providerId,
      status: { $in: ACTIVE_ALLOCATION_STATUSES },
      'requestPortions.request': { $in: requestIds },
    }).select('requestPortions.request requestPortions.quantityKg');

    if (session) linkedQuery.session(session);
    const linkedAllocations = await linkedQuery;
    const linkedQuantityByRequest = new Map();

    for (const allocation of linkedAllocations) {
      for (const portion of allocation.requestPortions || []) {
        const key = String(portion.request);
        const quantityKg = Number(portion.quantityKg || 0);
        linkedQuantityByRequest.set(
          key,
          (linkedQuantityByRequest.get(key) || 0) + quantityKg
        );
      }
    }

    // Active allocation totals are already counted above. Add only the
    // uncovered remainder of each legacy assignment to avoid double-counting.
    for (const request of legacyRequests) {
      const linkedQuantityKg =
        linkedQuantityByRequest.get(String(request._id)) || 0;
      const uncoveredKg = Math.max(
        0,
        Number(request.quantityKg || 0) - linkedQuantityKg
      );
      activeLoadKg += uncoveredKg;
    }
  }

  return activeLoadKg;
};

const lockProviderCapacity = async (providerId, session, fail) => {
  // Concurrent transactions touching the same provider must conflict/retry
  // before they can both reserve the same remaining capacity.
  const result = await TransportProvider.updateOne(
    { _id: providerId },
    { $inc: { capacityRevision: 1 } },
    { session }
  );

  if (result.matchedCount !== 1) {
    fail(409, 'Provider capacity changed. Refresh and try again.');
  }
};


// ---------------------------------------------------------------------------
// Matching: return available providers serving both regions
// with sufficient capacity. Prefer the tightest capacity fit.
// ---------------------------------------------------------------------------
const normalizeRegion = (value) =>
  String(value ?? '').trim().toLocaleLowerCase();

const providerServesRegion = (provider, region) => {
  const target = normalizeRegion(region);
  return Boolean(target) &&
    Array.isArray(provider?.regionsServed) &&
    provider.regionsServed.some(
      (served) => normalizeRegion(served) === target
    );
};

const findMatchingProviders = async (pickupRegion, destinationRegion, quantityKg) => {
  // Normalize in JavaScript so older records with case/space differences match.
  const candidates = await TransportProvider.find({ isAvailable: true });
  const matches = [];

  for (const provider of candidates) {
    if (
      !providerServesRegion(provider, pickupRegion) ||
      !providerServesRegion(provider, destinationRegion)
    ) continue;

    const activeLoadKg = await getProviderActiveLoadKg(provider._id);
    const remainingCapacityKg = Math.max(
      0,
      Number(provider.capacityKg) - activeLoadKg
    );

    if (remainingCapacityKg < Number(quantityKg)) continue;

    matches.push({
      provider,
      servesDestination: true,
      activeLoadKg,
      remainingCapacityKg,
      spareCapacityKg: remainingCapacityKg - Number(quantityKg),
      score: -(remainingCapacityKg - Number(quantityKg)),
    });
  }

  return matches.sort((a, b) => b.score - a.score);
};;

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
    const results = await Promise.all(providers.map(async (provider) => {
      const activeLoadKg = await getProviderActiveLoadKg(provider._id);
      return {
        ...provider.toObject(),
        activeLoadKg,
        remainingCapacityKg: Math.max(
          0,
          Number(provider.capacityKg) - activeLoadKg
        ),
      };
    }));

    res.json(results);
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
  const capacity = Number(capacityKg);
  if (!Number.isFinite(capacity) || capacity <= 0) return 'capacityKg must be greater than 0.';
  const capacityRanges = {
    'Pickup Car': [1000, 3000],
    'Isuzu Truck': [2000, 7000],
    'Heavy Truck': [10000, 30000],
    'Motorbike/Tricycle': [10, 25],
  };
  const range = capacityRanges[vehicleType];
  if (range && (capacity < range[0] || capacity > range[1])) {
    return `${vehicleType} capacity must be between ${range[0]} and ${range[1]} kg.`;
  }
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
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid provider id.' });
  }

  const validationError = validateProviderBody(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const session = await mongoose.startSession();

  try {
    let updatedProvider;
    const fail = (statusCode, message) => {
      const error = new Error(message);
      error.statusCode = statusCode;
      throw error;
    };

    await session.withTransaction(async () => {
      const existing = await TransportProvider.findById(req.params.id).session(session);
      if (!existing) fail(404, 'Provider not found.');

      await lockProviderCapacity(req.params.id, session, fail);

      const activeLoadKg = await getProviderActiveLoadKg(req.params.id, session);
      const capacityKg = Number(req.body.capacityKg);

      if (capacityKg < activeLoadKg) {
        fail(400, `Capacity cannot be reduced below the provider's active load of ${activeLoadKg} kg.`);
      }

      updatedProvider = await TransportProvider.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          phone: normalizePhone(req.body.phone),
          vehicleType: req.body.vehicleType,
          capacityKg,
          regionsServed: req.body.regionsServed,
          ratePerQuintalPerKm: req.body.ratePerQuintalPerKm === '' ? undefined : req.body.ratePerQuintalPerKm,
          isAvailable: req.body.isAvailable !== false,
          notes: req.body.notes,
        },
        { new: true, runValidators: true, session }
      );

      if (!updatedProvider) fail(404, 'Provider not found.');
    });

    return res.json(updatedProvider);
  } catch (error) {
    console.error('Update provider error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Unable to update provider. Please try again.',
    });
  } finally {
    await session.endSession();
  }
};

// DELETE /api/transport-providers/:id (admin) — blocked while active work exists.
const deleteProvider = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid provider id.' });
  }

  const session = await mongoose.startSession();

  try {
    const fail = (statusCode, message) => {
      const error = new Error(message);
      error.statusCode = statusCode;
      throw error;
    };

    await session.withTransaction(async () => {
      const existing = await TransportProvider.findById(req.params.id).session(session);
      if (!existing) fail(404, 'Provider not found.');

      await lockProviderCapacity(req.params.id, session, fail);

      const activeRequest = await LogisticsRequest.exists({
        assignedProvider: req.params.id,
        status: { $in: ACTIVE_ALLOCATION_STATUSES },
      }).session(session);

      const activeAllocation = await TransportAllocation.exists({
        provider: req.params.id,
        status: { $in: ACTIVE_ALLOCATION_STATUSES },
      }).session(session);

      if (activeRequest || activeAllocation) {
        fail(400, 'This provider has active jobs. Mark it unavailable instead of deleting.');
      }

      const deleted = await TransportProvider.findByIdAndDelete(
        req.params.id,
        { session }
      );

      if (!deleted) fail(404, 'Provider not found.');
    });

    return res.json({ message: 'Provider deleted.' });
  } catch (error) {
    console.error('Delete provider error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Unable to delete provider. Please try again.',
    });
  } finally {
    await session.endSession();
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

    const requestIds = requests.map((request) => request._id);
    const allocations = requestIds.length
      ? await TransportAllocation.find({
          'requestPortions.request': { $in: requestIds },
        })
          .populate('provider', 'name phone vehicleType capacityKg')
          .lean()
      : [];

    const result = requests.map((request) => {
      const item = request.toObject();

      item.allocations = allocations
        .map((allocation) => {
          const portion = (allocation.requestPortions || []).find(
            (entry) => String(entry.request) === String(request._id)
          );

          if (!portion) return null;

          return {
            ...allocation,
            requestPortionQuantityKg: Number(portion.quantityKg || 0),
          };
        })
        .filter(Boolean);

      return item;
    });

    res.json(result);
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
    if (!isValidId(req.params.id) || !isValidId(req.body.providerId)) {
      return res.status(400).json({
        message: 'Valid request id and providerId are required.',
      });
    }

    const request = await LogisticsRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.batch) {
      return res.status(400).json({
        message: 'This request belongs to a batch. Use the batch allocations endpoint.',
      });
    }

    const remainingQuantityKg = Math.max(
      0,
      Number(request.quantityKg || 0) - Number(request.allocatedQuantityKg || 0)
    );

    return allocateRequest({
      params: req.params,
      body: { ...req.body, quantityKg: remainingQuantityKg },
      user: req.user,
    }, res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


/**
 * POST /api/logistics/:id/allocations
 * Body: { providerId, quantityKg }
 * Admin only. Reserves a portion of one request for one provider.
 */
const allocateRequest = async (req, res) => {
  const { providerId } = req.body;
  const quantityKg = Number(req.body.quantityKg);
  const requestId = req.params.id;

  const fail = (statusCode, message, details = {}) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    throw error;
  };

  if (!isValidId(requestId) || !isValidId(providerId)) {
    return res.status(400).json({
      message: 'Valid request id and providerId are required.',
    });
  }

  if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
    return res.status(400).json({
      message: 'quantityKg must be a positive number.',
    });
  }

  const session = await mongoose.startSession();
  let allocationId;
  let providerName;
  let providerPhone;

  try {
    await session.withTransaction(async () => {
      const request = await LogisticsRequest.findById(requestId)
        .session(session);

      if (!request) {
        fail(404, 'Request not found.');
      }

      if (!['Pending', 'Partially Assigned'].includes(request.status)) {
        fail(
          400,
          'Only Pending or Partially Assigned requests can receive allocations.'
        );
      }

      if (request.batch) {
        fail(
          400,
          'This request belongs to an aggregation batch. Use the batch allocations endpoint.'
        );
      }

      const provider = await TransportProvider.findById(providerId)
        .session(session);

      if (!provider) {
        fail(404, 'Provider not found.');
      }

      if (!provider.isAvailable) {
        fail(400, 'Provider is marked unavailable.');
      }

      if (
        !providerServesRegion(provider, request.pickupRegion) ||
        !providerServesRegion(provider, request.destinationRegion)
      ) {
        fail(
          400,
          'Provider must serve both the pickup and destination regions.'
        );
      }

      await lockProviderCapacity(provider._id, session, fail);

      const activeLoadKg = await getProviderActiveLoadKg(provider._id, session);
      const remainingCapacityKg = Math.max(
        0,
        Number(provider.capacityKg) - activeLoadKg
      );

      if (quantityKg > remainingCapacityKg) {
        fail(400, 'Allocation exceeds this provider remaining capacity.', {
          providerCapacityKg: provider.capacityKg,
          activeLoadKg,
          remainingCapacityKg,
          requestedAllocationKg: quantityKg,
        });
      }

      const nextAllocated = {
        $add: [
          { $ifNull: ['$allocatedQuantityKg', 0] },
          quantityKg,
        ],
      };

      // Guard against over-allocation in the same atomic request update.
      const result = await LogisticsRequest.updateOne(
        {
          _id: request._id,
          status: { $in: ['Pending', 'Partially Assigned'] },
          $expr: {
            $lte: [nextAllocated, '$quantityKg'],
          },
        },
        [
          {
            $set: {
              allocatedQuantityKg: nextAllocated,
              status: {
                $cond: [
                  { $gte: [nextAllocated, '$quantityKg'] },
                  'Assigned',
                  'Partially Assigned',
                ],
              },
            },
          },
        ],
        { session, updatePipeline: true }
      );

      if (result.matchedCount !== 1) {
        const latest = await LogisticsRequest.findById(requestId)
          .session(session);

        const allocated = latest
          ? (latest.allocatedQuantityKg || 0)
          : 0;

        fail(
          409,
          'Insufficient remaining quantity, or the request changed during allocation.',
          {
            requestedQuantityKg: latest?.quantityKg,
            allocatedQuantityKg: allocated,
            remainingQuantityKg: latest
              ? Math.max(0, latest.quantityKg - allocated)
              : undefined,
          }
        );
      }

      const created = await TransportAllocation.create(
        [{
          provider: provider._id,
          requestPortions: [{
            request: request._id,
            quantityKg,
          }],
          totalQuantityKg: quantityKg,
          createdBy: req.user._id,
        }],
        { session }
      );

      allocationId = created[0]._id;
      providerName = provider.name;
      providerPhone = provider.phone;
    });

    // Notify only after the transaction commits successfully.
    const [allocation, updatedRequest] = await Promise.all([
      TransportAllocation.findById(allocationId)
        .populate('provider', 'name phone vehicleType capacityKg'),
      LogisticsRequest.findById(requestId),
    ]);

    if (!allocation || !updatedRequest) {
      console.error('Allocation committed but follow-up read failed.');
      return res.status(500).json({
        message: 'Allocation was saved, but its details could not be retrieved. Refresh the request before retrying.',
      });
    }

    const remainingQuantityKg = Math.max(
      0,
      updatedRequest.quantityKg - (updatedRequest.allocatedQuantityKg || 0)
    );

    try {
      await notify(
        updatedRequest.requester,
        quantityKg + ' kg of your ' + updatedRequest.cropName +
          ' load has been allocated to ' + providerName +
          ' (' + providerPhone + '). Remaining unallocated quantity: ' +
          remainingQuantityKg + ' kg.'
      );
    } catch (notificationError) {
      console.error(
        'Allocation notification failed:',
        notificationError.message
      );
    }

    return res.status(201).json({
      allocation,
      request: updatedRequest,
      remainingQuantityKg,
    });
  } catch (error) {
    console.error('Request allocation failed:', error.message);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : 'Unable to allocate this request at the moment.',
      ...(error.details || {}),
    });
  } finally {
    await session.endSession();
  }
};

// PATCH /api/logistics/:id/status  { status } (admin) — In Transit / Delivered.
const updateRequestStatus = async (req, res) => {
  return res.status(400).json({
    message: 'Request status is derived from transport allocations. Update the transport allocation status instead.',
  });
};


const updateAllocationStatus = async (req, res) => {
  let session;
  try {
    const { status } = req.body;

    if (!['In Transit', 'Delivered'].includes(status)) {
      return res.status(400).json({
        message: 'status must be "In Transit" or "Delivered".',
      });
    }

    if (!isValidId(req.params.allocationId)) {
      return res.status(400).json({ message: 'Invalid allocation id.' });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const allocation = await TransportAllocation
      .findById(req.params.allocationId)
      .session(session);

    if (!allocation) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Transport allocation not found.' });
    }

    const allowed = {
      Assigned: ['In Transit'],
      'In Transit': ['Delivered'],
    };

    if (!allowed[allocation.status]?.includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Cannot move an allocation from ' +
          allocation.status + ' to ' + status + '.',
      });
    }

    allocation.status = status;
    await allocation.save({ session });

    const requestIds = [
      ...new Set(allocation.requestPortions.map((portion) =>
        String(portion.request)
      )),
    ];

    for (const requestId of requestIds) {
      const request = await LogisticsRequest.findById(requestId).session(session);
      if (!request || request.status === 'Cancelled') continue;

      const linked = await TransportAllocation.find({
        'requestPortions.request': request._id,
        status: { $ne: 'Cancelled' },
      }).session(session);

      const allocatedKg = Number(request.allocatedQuantityKg || 0);
      const totalKg = Number(request.quantityKg || 0);

      if (allocatedKg + 0.000001 < totalKg) {
        request.status = allocatedKg > 0
          ? 'Partially Assigned'
          : request.batch ? 'Batched' : 'Pending';
      } else if (linked.length > 0 &&
          linked.every((item) => item.status === 'Delivered')) {
        request.status = 'Delivered';
      } else if (linked.some((item) => item.status === 'In Transit')) {
        request.status = 'In Transit';
      } else {
        request.status = 'Assigned';
      }

      await request.save({ session });
    }

    if (allocation.batch) {
      const batch = await AggregationBatch
        .findById(allocation.batch)
        .session(session);

      if (batch && batch.status !== 'Cancelled') {
        const batchAllocations = await TransportAllocation.find({
          batch: batch._id,
          status: { $ne: 'Cancelled' },
        }).session(session);

        const allocatedKg = Number(batch.allocatedQuantityKg || 0);
        const totalKg = Number(batch.totalQuantityKg || 0);

        if (allocatedKg + 0.000001 < totalKg) {
          batch.status = allocatedKg > 0 ? 'Partially Assigned' : 'Open';
        } else if (batchAllocations.length > 0 &&
            batchAllocations.every((item) => item.status === 'Delivered')) {
          batch.status = 'Delivered';
        } else if (batchAllocations.some((item) => item.status === 'In Transit')) {
          batch.status = 'In Transit';
        } else {
          batch.status = 'Assigned';
        }

        await batch.save({ session });
      }
    }

    await session.commitTransaction();

    const updated = await TransportAllocation.findById(allocation._id)
      .populate('provider', 'name phone vehicleType capacityKg')
      .populate('batch')
      .populate('requestPortions.request', 'cropName quantityKg allocatedQuantityKg status');

    return res.json(updated);
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    return res.status(500).json({ message: error.message });
  } finally {
    if (session) await session.endSession();
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
  const session = await mongoose.startSession();
  let createdBatch;
  let requestsForNotification = [];

  try {
    const { requestIds, providerId } = req.body;

    if (providerId) {
      return res.status(400).json({
        message: 'Create the batch first, then allocate portions to providers.',
      });
    }

    if (
      !Array.isArray(requestIds) ||
      requestIds.length < 2 ||
      !requestIds.every(isValidId) ||
      new Set(requestIds.map(String)).size !== requestIds.length
    ) {
      return res.status(400).json({
        message: 'Select at least two distinct valid requests to aggregate.',
      });
    }

    await session.withTransaction(async () => {
      const requests = await LogisticsRequest.find({
        _id: { $in: requestIds },
      }).session(session);

      if (requests.length !== requestIds.length) {
        const error = new Error('One or more requests were not found.');
        error.statusCode = 404;
        throw error;
      }

      if (requests.some((r) => r.status !== 'Pending' || r.batch)) {
        const error = new Error('Only unbatched Pending requests can be aggregated.');
        error.statusCode = 400;
        throw error;
      }

      const { pickupRegion, destinationRegion } = requests[0];

      if (requests.some(
        (r) =>
          r.pickupRegion !== pickupRegion ||
          r.destinationRegion !== destinationRegion
      )) {
        const error = new Error(
          'All requests in a batch must share the same pickup and destination region.'
        );
        error.statusCode = 400;
        throw error;
      }

      const totalQuantityKg = requests.reduce(
        (sum, r) => sum + Number(r.quantityKg),
        0
      );

      const batch = new AggregationBatch({
        pickupRegion,
        destinationRegion,
        requests: requests.map((r) => r._id),
        totalQuantityKg,
        allocatedQuantityKg: 0,
        status: 'Open',
        createdBy: req.user._id,
      });

      await batch.save({ session });

      const update = await LogisticsRequest.updateMany(
        {
          _id: { $in: requestIds },
          status: 'Pending',
          batch: { $exists: false },
        },
        { $set: { status: 'Batched', batch: batch._id } },
        { session }
      );

      if (update.modifiedCount !== requestIds.length) {
        const error = new Error(
          'One or more requests changed while the batch was being created. Please reload and try again.'
        );
        error.statusCode = 409;
        throw error;
      }

      createdBatch = batch;
      requestsForNotification = requests;
    });

    await Promise.all(requestsForNotification.map((r) =>
      notify(
        r.requester,
        `Your ${r.cropName} load was grouped into a batch. A transport provider will be allocated when capacity is available.`
      )
    ));

    return res.status(201).json({
      message: 'Open batch created successfully. Allocate it to providers by portions.',
      batch: createdBatch,
    });
  } catch (error) {
    console.error('Create batch error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : 'Unable to create the batch. Please try again.',
    });
  } finally {
    await session.endSession();
  }
};

// GET /api/logistics/aggregation/batches (admin)
const getBatches = async (req, res) => {
  try {
    const batches = await AggregationBatch.find()
      .populate('provider', 'name phone vehicleType capacityKg')
      .populate({
        path: 'requests',
        select: 'cropName quantity unit quantityKg allocatedQuantityKg status requester',
        populate: { path: 'requester', select: 'fullName phone' },
      })
      .sort({ createdAt: -1 });

    const batchIds = batches.map((batch) => batch._id);
    const allocations = batchIds.length
      ? await TransportAllocation.find({ batch: { $in: batchIds } })
          .populate('provider', 'name phone vehicleType capacityKg')
          .populate({
            path: 'requestPortions.request',
            select: 'cropName quantityKg allocatedQuantityKg status requester',
            populate: { path: 'requester', select: 'fullName phone' },
          })
          .lean()
      : [];

    const allocationsByBatch = new Map();

    for (const allocation of allocations) {
      const key = String(allocation.batch);
      if (!allocationsByBatch.has(key)) allocationsByBatch.set(key, []);
      allocationsByBatch.get(key).push(allocation);
    }

    res.json(
      batches.map((batch) => {
        const item = batch.toObject();
        item.allocations = allocationsByBatch.get(String(batch._id)) || [];
        return item;
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/logistics/aggregation/batches/:id/assign  { providerId } (admin)
const assignBatchProvider = async (req, res) => {
  return res.status(400).json({
    message: 'Whole-batch assignment is disabled. Use the batch allocations endpoint and specify request portions in kg.',
  });
};

const allocateBatch = async (req, res) => {
  const batchId = req.params.id;
  const { providerId, portions } = req.body;

  const fail = (statusCode, message, details = {}) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    throw error;
  };

  if (!isValidId(batchId) || !isValidId(providerId)) {
    return res.status(400).json({
      message: 'Valid batch id and providerId are required.',
    });
  }

  if (!Array.isArray(portions) || portions.length === 0) {
    return res.status(400).json({
      message: 'Provide at least one request portion.',
    });
  }

  const normalized = [];
  const seen = new Set();

  for (const portion of portions) {
    if (
      !portion ||
      !isValidId(portion.requestId) ||
      !Number.isFinite(Number(portion.quantityKg)) ||
      Number(portion.quantityKg) <= 0
    ) {
      return res.status(400).json({
        message: 'Each portion needs a valid requestId and positive quantityKg.',
      });
    }

    const requestId = String(portion.requestId);

    if (seen.has(requestId)) {
      return res.status(400).json({
        message: 'Each request may appear only once per allocation.',
      });
    }

    seen.add(requestId);
    normalized.push({
      requestId,
      quantityKg: Number(portion.quantityKg),
    });
  }

  const totalQuantityKg = normalized.reduce(
    (sum, portion) => sum + portion.quantityKg,
    0
  );

  const session = await mongoose.startSession();
  let allocationId;
  let committedPortions = [];

  try {
    await session.withTransaction(async () => {
      const batch = await AggregationBatch.findById(batchId)
        .session(session);

      if (!batch) fail(404, 'Batch not found.');

      if (!['Open', 'Partially Assigned'].includes(batch.status)) {
        fail(400, `This batch cannot receive allocations while ${batch.status}.`);
      }

      const provider = await TransportProvider.findById(providerId)
        .session(session);

      if (!provider) fail(404, 'Provider not found.');
      if (!provider.isAvailable) {
        fail(400, 'Provider is marked unavailable.');
      }

      if (
        !providerServesRegion(provider, batch.pickupRegion) ||
        !providerServesRegion(provider, batch.destinationRegion)
      ) {
        fail(400, 'Provider must serve both the pickup and destination regions.');
      }

      await lockProviderCapacity(provider._id, session, fail);

      const activeLoadKg = await getProviderActiveLoadKg(provider._id, session);
      const remainingCapacityKg = Math.max(
        0,
        Number(provider.capacityKg) - activeLoadKg
      );

      if (totalQuantityKg > remainingCapacityKg) {
        fail(400, 'Allocation exceeds this provider remaining capacity.', {
          providerCapacityKg: provider.capacityKg,
          activeLoadKg,
          remainingCapacityKg,
          requestedAllocationKg: totalQuantityKg,
        });
      }

      const batchRequestIds = new Set(
        batch.requests.map((id) => String(id))
      );

      for (const portion of normalized) {
        if (!batchRequestIds.has(portion.requestId)) {
          fail(400, 'Every request portion must belong to this batch.', {
            requestId: portion.requestId,
          });
        }

        const request = await LogisticsRequest.findById(portion.requestId)
          .session(session);

        if (!request) {
          fail(404, 'A request belonging to the batch was not found.', {
            requestId: portion.requestId,
          });
        }

        if (!['Batched', 'Partially Assigned'].includes(request.status)) {
          fail(400, 'Only Batched or Partially Assigned requests can receive batch allocations.', {
            requestId: portion.requestId,
            status: request.status,
          });
        }

        const nextAllocated = {
          $add: [
            { $ifNull: ['$allocatedQuantityKg', 0] },
            portion.quantityKg,
          ],
        };

        const updated = await LogisticsRequest.updateOne(
          {
            _id: request._id,
            status: { $in: ['Batched', 'Partially Assigned'] },
            $expr: { $lte: [nextAllocated, '$quantityKg'] },
          },
          [
            {
              $set: {
                allocatedQuantityKg: nextAllocated,
                status: {
                  $cond: [
                    { $gte: [nextAllocated, '$quantityKg'] },
                    'Assigned',
                    'Partially Assigned',
                  ],
                },
              },
            },
          ],
          { session, updatePipeline: true }
        );

        if (updated.matchedCount !== 1) {
          fail(409, 'A request changed during allocation. Refresh and try again.', {
            requestId: portion.requestId,
          });
        }
      }

      const updatedBatch = await AggregationBatch.updateOne(
        {
          _id: batch._id,
          status: { $in: ['Open', 'Partially Assigned'] },
          $expr: {
            $lte: [
              {
                $add: [
                  { $ifNull: ['$allocatedQuantityKg', 0] },
                  totalQuantityKg,
                ],
              },
              '$totalQuantityKg',
            ],
          },
        },
        [
          {
            $set: {
              allocatedQuantityKg: {
                $add: [
                  { $ifNull: ['$allocatedQuantityKg', 0] },
                  totalQuantityKg,
                ],
              },
              status: {
                $cond: [
                  {
                    $gte: [
                      {
                        $add: [
                          { $ifNull: ['$allocatedQuantityKg', 0] },
                          totalQuantityKg,
                        ],
                      },
                      '$totalQuantityKg',
                    ],
                  },
                  'Assigned',
                  'Partially Assigned',
                ],
              },
            },
          },
        ],
        { session, updatePipeline: true }
      );

      if (updatedBatch.matchedCount !== 1) {
        fail(
          409,
          'Allocation exceeds the batch remaining quantity or the batch changed. Refresh and try again.'
        );
      }

      const allocation = await TransportAllocation.create(
        [
          {
            provider: provider._id,
            batch: batch._id,
            requestPortions: normalized.map((portion) => ({
              request: portion.requestId,
              quantityKg: portion.quantityKg,
            })),
            totalQuantityKg,
            createdBy: req.user?._id,
          },
        ],
        { session }
      );

      allocationId = allocation[0]._id;
      committedPortions = normalized;
    });

    for (const portion of committedPortions) {
      const request = await LogisticsRequest.findById(portion.requestId)
        .select('requester')
        .lean();

      const recipientId = request?.requester;

      if (recipientId) {
        await notify(
          recipientId,
          `A transport provider has been assigned ${portion.quantityKg} kg of your batch request.`
        );
      }
    }

    return res.status(201).json({
      message: 'Batch allocation created successfully.',
      allocationId,
      totalQuantityKg,
      portions: committedPortions,
    });
  } catch (error) {
    console.error('Batch allocation error:', error);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : 'Unable to allocate this batch. Please try again.',
      ...(error.details ? { details: error.details } : {}),
    });
  } finally {
    await session.endSession();
  }
};



module.exports = {
  listProviders, createProvider, updateProvider, deleteProvider,
  createRequest, getMyRequests, cancelRequest, getAllRequests,
  getRequestMatches, assignProvider, allocateRequest, updateRequestStatus,
  getAggregationSuggestions, createBatch, getBatches, assignBatchProvider,
  allocateBatch, updateAllocationStatus,
  findMatchingProviders,
};
