import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trainingService } from '../../services/trainingService';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ExtensionTrainings() {
  const [trainings, setTrainings] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [targetMode, setTargetMode] = useState('region'); // 'region' | 'zone' | 'farmers'
  const [zone, setZone] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);

  const load = async () => {
    try {
      const [trainingsData, farmersData] = await Promise.all([
        trainingService.getMyTrainings(),
        extensionService.getFarmersList(),
      ]);
      setTrainings(trainingsData);
      setFarmers(farmersData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load your trainings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
    setTargetMode('region');
    setZone('');
    setSelectedFarmerIds([]);
  };

  const toggleFarmer = (id) => {
    setSelectedFarmerIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date || !location.trim()) {
      toast.error('Please fill in title, description, date, and location.');
      return;
    }
    if (targetMode === 'farmers' && selectedFarmerIds.length === 0) {
      toast.error('Please select at least one farmer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await trainingService.createTraining({
        title: title.trim(),
        description: description.trim(),
        date,
        location: location.trim(),
        zone: targetMode === 'zone' ? zone.trim() || undefined : undefined,
        targetFarmers: targetMode === 'farmers' ? selectedFarmerIds : undefined,
      });
      toast.success('Training scheduled!');
      resetForm();
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule training.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await trainingService.deleteTraining(id);
      setTrainings((prev) => prev.filter((t) => t._id !== id));
      toast.success('Training cancelled.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel training.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-[#166534]">🎓 Trainings</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : '+ Schedule Training'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">Coordinate training programs for farmers in your region.</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Soil Conservation Workshop"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Adama Farmers' Hall"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
            <select
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="region">Whole Region</option>
              <option value="zone">Specific Zone</option>
              <option value="farmers">Specific Farmer(s)</option>
            </select>

            {targetMode === 'zone' && (
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="e.g. East Shewa"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            )}

            {targetMode === 'farmers' && (
              farmers.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">You have no assigned farmers yet — ask an admin to assign some.</p>
              ) : (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {farmers.map((f) => (
                    <label key={f._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedFarmerIds.includes(f._id)}
                        onChange={() => toggleFarmer(f._id)}
                        className="accent-green-600"
                      />
                      {f.fullName}{f.phone ? ` (${f.phone})` : ''}
                    </label>
                  ))}
                </div>
              )
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this training cover?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Training'}
          </button>
        </form>
      )}

      <h3 className="text-lg font-bold text-[#166534] mb-3">Your Scheduled Trainings</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading..." />
      ) : trainings.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't scheduled any trainings yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {trainings.map((t) => (
            <div key={t._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-gray-900">{t.title}</p>
                <p className="text-sm text-gray-700 mt-1">{t.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  📅 {new Date(t.date).toLocaleDateString()} · 📍 {t.location} ·{' '}
                  {t.targetFarmers?.length > 0
                    ? `Sent to: ${t.targetFarmers.map((f) => f.fullName).join(', ')}`
                    : (t.zone || 'whole region')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(t._id)}
                disabled={deletingId === t._id}
                className="shrink-0 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg"
              >
                {deletingId === t._id ? '...' : 'Cancel'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
