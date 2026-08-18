import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddressDropdown from '../../components/common/AddressDropdown';
import { validateExtensionWorkerPhone } from '../../utils/validation';

export default function AdminExtensionWorkers() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', region: '', zone: '', woreda: '', kebele: '',
  });
  const [phoneError, setPhoneError] = useState('');

  const loadWorkers = async () => {
    try {
      const data = await adminService.getExtensionWorkers();
      setWorkers(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load extension workers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'phone') {
      if (!value) {
        setPhoneError('Phone number is required.');
      } else if (!validateExtensionWorkerPhone(value)) {
        setPhoneError('Phone number must be exactly 10 digits starting with 07 or 09 (e.g. 0712345678).');
      } else {
        setPhoneError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.region || !formData.zone || !formData.woreda) {
      toast.error('Full name, email, region, zone, and woreda are required.');
      return;
    }

    if (!formData.phone) {
      setPhoneError('Phone number is required.');
      toast.error('Phone number is required.');
      return;
    }
    if (!validateExtensionWorkerPhone(formData.phone)) {
      setPhoneError('Phone number must be exactly 10 digits starting with 07 or 09 (e.g. 0712345678).');
      toast.error('Please enter a valid phone number before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminService.createExtensionWorker(formData);
      setCreatedCredentials({ email: formData.email, password: result.temporaryPassword });
      setFormData({ fullName: '', email: '', phone: '', region: '', zone: '', woreda: '', kebele: '' });
      setPhoneError('');
      loadWorkers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create extension worker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>👩‍🔬 Extension Workers</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setCreatedCredentials(null); setPhoneError(''); }}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ Create Extension Worker'}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{workers.length} active extension workers.</p>

      {createdCredentials && (
        <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#e65100' }}>✅ Worker created — share these one-time credentials:</p>
          <p style={{ margin: '0.4rem 0 0 0' }}>Email: <strong>{createdCredentials.email}</strong></p>
          <p style={{ margin: 0 }}>Temporary Password: <strong>{createdCredentials.password}</strong></p>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#a1622d' }}>They'll be required to set a new password on first login.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            {/* Free-text fields per spec: Gmail address and phone number are plain text inputs, not dropdowns. */}
            <input name="email" type="email" placeholder="Gmail Address" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            <div>
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number (e.g. 0712345678)"
                value={formData.phone}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: `1px solid ${phoneError ? '#c62828' : '#ccc'}`, boxSizing: 'border-box' }}
              />
              {phoneError && (
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#c62828' }}>{phoneError}</p>
              )}
            </div>
          </div>

          {/* Cascading Region -> Zone -> Woreda -> Kebele picker covering all 9 Regional States. */}
          <AddressDropdown
            value={{ region: formData.region, zone: formData.zone, woreda: formData.woreda, kebele: formData.kebele }}
            onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
          />

          <button
            type="submit"
            disabled={isSubmitting || !formData.phone || !validateExtensionWorkerPhone(formData.phone)}
            style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '4px', fontWeight: 'bold', cursor: (isSubmitting || !formData.phone || !validateExtensionWorkerPhone(formData.phone)) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !formData.phone || !validateExtensionWorkerPhone(formData.phone)) ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Creating...' : 'Create Worker'}
          </button>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading..." />
      ) : workers.length === 0 ? (
        <p style={{ color: '#666' }}>No extension workers yet.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{w.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{w.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{[w.region, w.zone, w.woreda].filter(Boolean).join(' / ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
