import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';

// Shown on a buyer's order card when they've chosen Telebirr and haven't
// yet uploaded proof of payment (or the farmer rejected their last
// screenshot). Collects both the screenshot AND the Telebirr transaction ID
// in one step — matching "complete the payment via Telebirr and upload the
// receipt screenshot ... clicks Confirm Payment" from the workflow spec.
export default function TelebirrProofUpload({ paymentId, onUploaded }) {
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select your Telebirr payment screenshot.');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Please enter the Telebirr transaction ID from your receipt/SMS.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await paymentService.uploadTelebirrProof(paymentId, {
        file,
        transactionId: transactionId.trim(),
      });
      toast.success(result.message || 'Screenshot uploaded! The farmer will verify your payment.');
      setFile(null);
      setPreviewUrl(null);
      setTransactionId('');
      onUploaded?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload payment proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '0.75rem',
        padding: '0.9rem',
        backgroundColor: '#f1f8f2',
        border: '1px solid #c8e6c9',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#1b5e20' }}>
        📱 Upload Telebirr Payment Proof
      </p>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: '0.25rem' }}>
          Transaction ID (from your Telebirr SMS/receipt) <span style={{ color: '#d32f2f' }}>*</span>
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g. CI91A2B3C4"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '0.9rem' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: '0.25rem' }}>
          Screenshot <span style={{ color: '#d32f2f' }}>*</span>
        </label>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} style={{ fontSize: '0.85rem' }} />
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Selected screenshot preview"
          style={{ maxWidth: '200px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#2e7d32',
          color: 'white',
          border: 'none',
          padding: '0.55rem 1.1rem',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? 'Uploading...' : '✅ Confirm Payment'}
      </button>
    </form>
  );
}
