import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extensionService } from '../../services/extensionService';
import { fieldConditionService } from '../../services/fieldConditionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { cropTypes } from '../../utils/constants';

const CONDITION_TYPES = ['Crop Condition', 'Disease/Pest', 'Field Condition'];

export default function ExtensionCropConditions() {
  const [farmers, setFarmers] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [farmerId, setFarmerId] = useState('');
  const [conditionType, setConditionType] = useState('');
  const [cropType, setCropType] = useState('');
  const [description, setDescription] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const load = async () => {
    try {
      const [farmersData, conditionsData] = await Promise.all([
        extensionService.getFarmersList(),
        fieldConditionService.getMyConditions(),
      ]);
      setFarmers(farmersData);
      setConditions(conditionsData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFarmerId('');
    setConditionType('');
    setCropType('');
    setDescription('');
    setRecommendation('');
    setEditingId(null);
  };

  const handleEdit = (c) => {
    setEditingId(c._id);
    setFarmerId(c.farmer?._id || '');
    setConditionType(c.conditionType);
    setCropType(c.cropType || '');
    setDescription(c.description);
    setRecommendation(c.recommendation || '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !farmerId) {
      toast.error('Please select a farmer.');
      return;
    }
    if (!conditionType) {
      toast.error('Please select a condition type.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please describe the condition.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await fieldConditionService.updateCondition(editingId, {
          conditionType,
          cropType: cropType || undefined,
          description: description.trim(),
          recommendation: recommendation.trim() || undefined,
        });
        toast.success('Condition report updated!');
      } else {
        await fieldConditionService.createCondition({
          farmerId,
          conditionType,
          cropType: cropType || undefined,
          description: description.trim(),
          recommendation: recommendation.trim() || undefined,
        });
        toast.success('Condition report saved!');
      }
      resetForm();
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save condition report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await fieldConditionService.deleteCondition(id);
      setConditions((prev) => prev.filter((c) => c._id !== id));
      toast.success('Condition report deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete condition report.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-[#166534]">🌾 Crop & Field Conditions</h2>
        <button
          onClick={() => { setShowForm((v) => !v); if (showForm) resetForm(); }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : '+ Report Condition'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">Report crop condition, disease/pest situations, or general field condition for a specific farmer.</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farmer</label>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              disabled={!!editingId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            >
              <option value="">-- Select Farmer --</option>
              {farmers.map((f) => (
                <option key={f._id} value={f._id}>{f.fullName}{f.phone ? ` (${f.phone})` : ''}</option>
              ))}
            </select>
            {editingId && <p className="text-xs text-gray-400 mt-1">Farmer can't be changed on an existing report.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition Type</label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">-- Select Type --</option>
              {CONDITION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type <span className="text-gray-400">(optional)</span></label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Not specified</option>
              {cropTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you observed..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="What should the farmer do about it?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : editingId ? 'Update Report' : 'Save Report'}
          </button>
        </form>
      )}

      <h3 className="text-lg font-bold text-[#166534] mb-3">Your Filed Reports</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading..." />
      ) : conditions.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't filed any condition reports yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {conditions.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-gray-900">{c.conditionType}{c.cropType ? ` · ${c.cropType}` : ''}</p>
                <p className="text-sm text-gray-700 mt-1">{c.description}</p>
                {c.recommendation && <p className="text-sm text-[#166534] mt-1">💡 {c.recommendation}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  For {c.farmer?.fullName || 'Unknown farmer'} · {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(c)}
                  className="text-xs font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
                  disabled={deletingId === c._id}
                  className="text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg"
                >
                  {deletingId === c._id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
