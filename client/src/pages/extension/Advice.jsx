import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adviceService } from '../../services/adviceService';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { cropTypes } from '../../utils/constants';

export default function ExtensionAdvice() {
  const [adviceList, setAdviceList] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cropType, setCropType] = useState('');
  const [targetMode, setTargetMode] = useState('region'); // 'region' | 'zone' | 'farmers'
  const [zone, setZone] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);

  const load = async () => {
    try {
      const [adviceData, farmersData] = await Promise.all([
        adviceService.getMyAdvice(),
        extensionService.getFarmersList(),
      ]);
      setAdviceList(adviceData);
      setFarmers(farmersData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load your advice posts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCropType('');
    setTargetMode('region');
    setZone('');
    setSelectedFarmerIds([]);
  };

  const toggleFarmer = (id) => {
    setSelectedFarmerIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in a title and the advice content.');
      return;
    }
    if (targetMode === 'farmers' && selectedFarmerIds.length === 0) {
      toast.error('Please select at least one farmer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adviceService.createAdvice({
        title: title.trim(),
        content: content.trim(),
        cropType: cropType || undefined,
        zone: targetMode === 'zone' ? zone.trim() || undefined : undefined,
        targetFarmers: targetMode === 'farmers' ? selectedFarmerIds : undefined,
      });
      toast.success('Advice posted!');
      resetForm();
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post advice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await adviceService.deleteAdvice(id);
      setAdviceList((prev) => prev.filter((a) => a._id !== id));
      toast.success('Advice removed.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove advice.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-[#166534]">💡 Agricultural Advice</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : '+ Create Advice'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">Share crop care and soil management guidance with farmers in your region.</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Preparing Soil for Teff Planting"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type <span className="text-gray-400">(optional — leave blank for general advice)</span></label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">General (all crops)</option>
              {cropTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Advice Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your guidance..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Advice'}
          </button>
        </form>
      )}

      <h3 className="text-lg font-bold text-[#166534] mb-3">Your Posted Advice</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading..." />
      ) : adviceList.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't posted any advice yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {adviceList.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-gray-900">{a.title}</p>
                {a.cropType && <p className="text-sm font-medium text-[#166534] mt-0.5">🌾 {a.cropType}</p>}
                <p className="text-sm text-gray-700 mt-1">{a.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {a.targetFarmers?.length > 0
                    ? `Sent to: ${a.targetFarmers.map((f) => f.fullName).join(', ')}`
                    : `${a.region}${a.zone ? ` / ${a.zone}` : ' (whole region)'}`}
                  {' · '}{new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a._id)}
                disabled={deletingId === a._id}
                className="shrink-0 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg"
              >
                {deletingId === a._id ? '...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
