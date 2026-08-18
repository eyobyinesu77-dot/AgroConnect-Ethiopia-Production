import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const FIELD_LABELS = {
  fullName: 'Full Name',
  phone: 'Phone Number',
  region: 'Region',
  zone: 'Zone',
  woreda: 'Woreda',
  kebele: 'Kebele',
};

export default function ProfileForm({ extraFields = [] }) {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await userService.getProfile();
        if (isMounted) {
          setProfile(data);
          setFormData(data);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load profile.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fields = ['fullName', 'phone', 'region', 'zone', 'woreda', 'kebele', ...extraFields];
      const payload = {};
      fields.forEach((f) => { if (formData[f] !== undefined) payload[f] = formData[f]; });

      const updated = await userService.updateProfile(payload);
      setProfile(updated);
      updateUser({ name: updated.fullName });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading your profile..." />;
  }

  const baseFields = ['fullName', 'phone', 'region', 'zone', 'woreda', 'kebele'];

  return (
    <form
      onSubmit={handleSubmit}
      style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}
    >
      <div style={{ marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #eee' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#999' }}>Email (cannot be changed)</p>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{profile?.email}</p>
      </div>

      {[...baseFields, ...extraFields].map((field) => (
        <div key={field}>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
            {FIELD_LABELS[field] || field}
          </label>
          <input
            type="text"
            name={field}
            value={formData[field] || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isSaving}
        style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
