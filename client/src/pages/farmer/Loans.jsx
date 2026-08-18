import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { loanService } from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_COLORS = {
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Approved: { bg: '#e8f5e9', text: '#2e7d32' },
  Rejected: { bg: '#ffebee', text: '#c62828' },
};

export default function FarmerLoans() {
  const { t } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [reasons, setReasons] = useState([]);

  const [bankType, setBankType] = useState('');
  const [customBank, setCustomBank] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLoans = async () => {
    try {
      const data = await loanService.getMyLoans();
      setLoans(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load loan history.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const data = await loanService.getLoanMetadata();
      setBanks(data.banks || []);
      setReasons(data.reasons || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load form options.');
    } finally {
      setIsMetaLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
    loadMetadata();
  }, []);

  const resetForm = () => {
    setBankType('');
    setCustomBank('');
    setAmount('');
    setReason('');
    setCustomReason('');
    setDuration('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankType) {
      toast.error('Please select a bank or financial institution.');
      return;
    }
    if (bankType === 'Other' && !customBank.trim()) {
      toast.error('Please type the bank/institution name, or choose one from the list.');
      return;
    }
    const parsedAmount = Number(String(amount).replace(/,/g, '').trim());
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid loan amount.');
      return;
    }
    if (!reason) {
      toast.error('Please select what the loan is for.');
      return;
    }
    if (reason === 'Other' && !customReason.trim()) {
      toast.error('Please type the loan reason, or choose one from the list.');
      return;
    }
    if (!duration.trim()) {
      toast.error('Please specify the loan duration (how long).');
      return;
    }

    const finalBankType = bankType === 'Other' ? customBank.trim() : bankType;
    const finalReason = reason === 'Other' ? customReason.trim() : reason;

    setIsSubmitting(true);
    try {
      await loanService.applyLoan({
        amount: parsedAmount,
        reason: finalReason,
        bankType: finalBankType,
        duration: duration.trim(),
      });
      toast.success('Your loan request has been submitted! 🎉');
      resetForm();
      loadLoans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit loan request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('loans_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('loans_subtitle')}</p>

      {isMetaLoading ? (
        <LoadingSpinner fullScreen={false} label={t('loans_form_loading')} />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('loans_bank_label')}</label>
            <select
              value={bankType}
              onChange={(e) => setBankType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}
            >
              <option value="">{t('loans_bank_placeholder')}</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            {bankType === 'Other' && (
              <input
                type="text"
                value={customBank}
                onChange={(e) => setCustomBank(e.target.value)}
                placeholder={t('loans_bank_custom_placeholder')}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('loans_amount_label')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('loans_reason_label')}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}
            >
              <option value="">{t('loans_reason_placeholder')}</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t('loans_reason_custom_placeholder')}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('loans_duration_label')}</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={t('loans_duration_placeholder')}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? t('loans_submitting') : t('loans_submit')}
          </button>
        </form>
      )}

      <h3 style={{ color: '#1b5e20', marginBottom: '1rem' }}>{t('loans_history_title')}</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('loans_history_loading')} />
      ) : loans.length === 0 ? (
        <p style={{ color: '#666' }}>{t('loans_history_empty')}</p>
      ) : (
        loans.map((loan) => {
          const colors = STATUS_COLORS[loan.status] || STATUS_COLORS.Pending;
          return (
            <div
              key={loan._id}
              style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {loan.cropImage && (
                  <img
                    src={loan.cropImage}
                    alt="Crop"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                  />
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{Number(loan.amount).toLocaleString()} ETB</p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#777' }}>{loan.reason}</p>
                  {loan.bankType && (
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>{loan.bankType}{loan.duration ? ` · ${loan.duration}` : ''}</p>
                  )}
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>{new Date(loan.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span style={{ padding: '0.35rem 0.7rem', borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
                {loan.status}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
