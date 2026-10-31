import React, { useCallback, useEffect, useState } from 'react';
import { logisticsService } from '../../services/logisticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TransportProviderDashboard() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadAllocations = useCallback(async () => {
    try {
      setError('');
      const result = await logisticsService.getMyAllocations();
      setAllocations(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load allocations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  const updateStatus = async (allocation, nextStatus) => {
    try {
      setUpdatingId(allocation._id);
      await logisticsService.updateMyAllocationStatus(
        allocation._id,
        nextStatus
      );
      await loadAllocations();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        label="Loading allocations..."
      />
    );
  }

  return (
    <main className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">
          Transport Provider Dashboard
        </h1>
        <p className="mt-1 text-gray-600">
          View your assigned deliveries and update their progress.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {allocations.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-600">
          No allocations have been assigned to you yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {allocations.map((allocation) => {
            const portions = allocation.requestPortions || [];
            const nextStatus =
              allocation.status === 'Assigned'
                ? 'In Transit'
                : allocation.status === 'In Transit'
                  ? 'Delivered'
                  : null;

            return (
              <section
                key={allocation._id}
                className="rounded-xl border bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center gap-3">
                  <h2 className="font-semibold text-gray-800">
                    Delivery allocation
                  </h2>
                  <span className="rounded-full bg-green-50 text-green-800 px-3 py-1 text-sm">
                    {allocation.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Total quantity</p>
                  <p className="font-semibold">
                    {Number(allocation.totalQuantityKg || 0).toLocaleString()} kg
                  </p>
                </div>

                {portions.map((portion, index) => {
                  const request = portion.request || {};

                  return (
                    <div
                      key={request._id || index}
                      className="rounded-lg bg-gray-50 p-3 space-y-1"
                    >
                      <p className="font-medium">
                        {request.cropName || request.product?.name || 'Crop request'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pickup: {request.pickupRegion || request.pickupZone || '—'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Destination: {request.destinationAddress || request.destinationRegion || '—'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {Number(portion.quantityKg || 0).toLocaleString()} kg
                      </p>
                    </div>
                  );
                })}

                {nextStatus && (
                  <button
                    type="button"
                    disabled={updatingId === allocation._id}
                    onClick={() => updateStatus(allocation, nextStatus)}
                    className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium px-4 py-2.5"
                  >
                    {updatingId === allocation._id
                      ? 'Updating...'
                      : nextStatus === 'In Transit'
                        ? 'Mark In Transit'
                        : 'Mark Delivered'}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
