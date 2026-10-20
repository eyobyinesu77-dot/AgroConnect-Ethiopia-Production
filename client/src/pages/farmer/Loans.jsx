import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { loanService } from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey, dataLabel } from '../../utils/i18nKeys';

const STATUS_COLORS = {
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Approved: { bg: '#e8f5e9', text: '#2e7d32' },
  Rejected: { bg: '#ffebee', text: '#c62828' },
};

const LOAN_INTEREST_RATES = Object.freeze({
  '6 months': 12,
  '1 year': 15,
  '2 years': 18,
  '3 years': 20,
});


export default function FarmerLoans() {
  const { t, formatNumber, formatDate } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [reasons, setReasons] = useState([]);

  const [bankType, setBankType] = useState('');
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewAmount = Number(String(amount).replace(/,/g, '').trim());
  const previewInterestRate = LOAN_INTEREST_RATES[duration];
  const hasValidPreview =
    Number.isFinite(previewAmount) &&
    previewAmount > 0 &&
    previewInterestRate !== undefined;

  const previewInterestAmount = hasValidPreview
    ? Math.round((previewAmount * previewInterestRate / 100 + Number.EPSILON) * 100) / 100
    : 0;

  const previewTotalRepayment = hasValidPreview
    ? Math.round((previewAmount + previewInterestAmount + Number.EPSILON) * 100) / 100
    : 0;


  const loadLoans = async () => {
    try {
      const data = await loanService.getMyLoans();
      setLoans(data);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'loans_err_history', 'loans_err_history')));
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
      toast.error(t(apiErrorKey(error, 'loans_err_options', 'loans_err_options')));
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
    setAccountNumber('');
    setAmount('');
    setReason('');
    setCustomReason('');
    setDuration('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankType) {
      toast.error(t('loans_err_bank'));
      return;
    }
    if (bankType === 'Other' && !customBank.trim()) {
      toast.error(t('loans_err_bank_custom'));
      return;
    }
    if (accountNumber.trim().length === 0 || Array.from(accountNumber.trim()).some(ch => ch < "0" || ch > "9")) {
      toast.error('Enter a valid bank account number using digits only.');
      return;
    }
    const parsedAmount = Number(String(amount).replace(/,/g, '').trim());
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount < 1000 || parsedAmount > 100000) {
      toast.error('Loan amount must be between 1,000 and 100,000 ETB.');
      return;
    }
    if (!reason) {
      toast.error(t('loans_err_reason'));
      return;
    }
    if (reason === 'Other' && !customReason.trim()) {
      toast.error(t('loans_err_reason_custom'));
      return;
    }
    if (!duration.trim()) {
      toast.error(t('loans_err_duration'));
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
        accountNumber: accountNumber.trim(),
        duration: duration.trim(),
      });
      toast.success(t('loans_submitted_toast'));
      resetForm();
      loadLoans();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'loans_err_submit', 'loans_err_submit')));
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
                <option key={bank} value={bank}>{bank === 'Other' ? t('bank_other') : bank}</option>
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
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Bank account number</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Enter your bank account number"
              aria-label="Bank account number"
              required
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('loans_amount_label')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1,000 - 100,000 ETB"
              aria-label="Loan amount (minimum 1,000 ETB, maximum 100,000 ETB)"
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
                <option key={r} value={r}>{dataLabel(t, 'loanreason', r)}</option>
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
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}
            >
              <option value="">Select loan duration</option>
              <option value="6 months">6 Months — 12% total interest</option>
              <option value="1 year">1 Year — 15% total interest</option>
              <option value="2 years">2 Years — 18% total interest</option>
              <option value="3 years">3 Years — 20% total interest</option>
            </select>
          </div>


          {hasValidPreview && (
            <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '1rem', color: '#1b5e20' }}>
              <h4 style={{ margin: '0 0 0.75rem 0' }}>Loan Repayment Estimate</h4>
              <p style={{ margin: '0.35rem 0' }}>Principal: {formatNumber(previewAmount)} {t('unit_etb')}</p>
              <p style={{ margin: '0.35rem 0' }}>Total interest rate: {previewInterestRate}%</p>
              <p style={{ margin: '0.35rem 0' }}>Interest amount: {formatNumber(previewInterestAmount)} {t('unit_etb')}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', fontSize: '1.05rem' }}>Estimated total repayment: {formatNumber(previewTotalRepayment)} {t('unit_etb')}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#555' }}>This is an estimate. Final loan terms are confirmed after approval.</p>
            </div>
          )}

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
                    alt={t('alt_loan_crop')}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                  />
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{formatNumber(loan.amount)} {t('unit_etb')}</p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#777' }}>{dataLabel(t, 'loanreason', loan.reason)}</p>
                  {loan.bankType && (
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>{loan.bankType === 'Other' ? t('bank_other') : loan.bankType}{loan.duration ? ` · ${loan.duration}` : ''}</p>
                  )}
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>{formatDate(loan.createdAt)}</p>
                  {loan.status === 'Approved' && (
                    <div style={{ marginTop: '0.65rem', padding: '0.75rem', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', color: '#1b5e20', fontSize: '0.85rem' }}>
                      <p style={{ margin: '0.25rem 0' }}>
                        Principal: {formatNumber(loan.amount)} {t('unit_etb')}
                      </p>
                      <p style={{ margin: '0.25rem 0' }}>
                        Interest rate: {formatNumber(loan.interestRate || 0)}%
                      </p>
                      <p style={{ margin: '0.25rem 0' }}>
                        Interest amount: {formatNumber(loan.interestAmount || 0)} {t('unit_etb')}
                      </p>
                      <p style={{ margin: '0.35rem 0 0 0', fontWeight: 'bold' }}>
                        Total repayment: {formatNumber(loan.totalRepayment || loan.amount)} {t('unit_etb')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <span style={{ padding: '0.35rem 0.7rem', borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
                {dataLabel(t, 'loan_status', loan.status)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
