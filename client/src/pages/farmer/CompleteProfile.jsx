import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { validateFayidaId } from '../../utils/validation';
import AddressDropdown from '../../components/common/AddressDropdown';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import './CompleteProfile.css';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If not a farmer, redirect
  if (!user || user.role !== 'farmer') {
    return <Navigate to="/login" replace />;
  }

  const [formData, setFormData] = useState({
    region: user.region || '',
    zone: user.zone || '',
    woreda: user.woreda || '',
    kebele: user.kebele || '',
    fayidaId: user.fayidaId || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'region':
        if (!value) error = t('completeprofile_err_region');
        break;

      case 'zone':
        if (!value) error = t('completeprofile_err_zone');
        break;

      case 'woreda':
        if (!value) error = t('completeprofile_err_woreda');
        break;

      case 'fayidaId':
        if (!value) {
          error = t('completeprofile_err_fayida_required');
        } else if (!validateFayidaId(value)) {
          error = t('completeprofile_err_fayida_format');
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, formData[name]);
    setErrors({ ...errors, [name]: error });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fayidaId') {
      const sanitized = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: sanitized });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleAddressChange = (location) => {
    setFormData((prev) => ({ ...prev, ...location }));

    // Clear errors for changed fields
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(location).forEach((key) => {
        if (next[key]) delete next[key];
      });
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      region: true,
      zone: true,
      woreda: true,
      fayidaId: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const newErrors = {};
    let hasErrors = false;

    const requiredFields = ['region', 'zone', 'woreda', 'fayidaId'];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to update user profile
      await userService.updateProfile({
        region: formData.region,
        zone: formData.zone,
        woreda: formData.woreda,
        kebele: formData.kebele || null,
        fayidaId: formData.fayidaId,
      });

      // Update local auth context
      updateUser({
        region: formData.region,
        zone: formData.zone,
        woreda: formData.woreda,
        kebele: formData.kebele,
        fayidaId: formData.fayidaId,
      });

      toast.success(t('completeprofile_toast_success'));

      // Redirect to farmer dashboard
      setTimeout(() => {
        navigate('/farmer/dashboard');
      }, 1000);
    } catch (error) {
      console.error('❌ Profile completion error:', error);
      const message = !error.response
        ? t('completeprofile_toast_network_error')
        : error.response?.data?.message || t('completeprofile_toast_generic_error');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="complete-profile-container">
      <div className="complete-profile-card">
        <div className="profile-header">
          <h2 className="profile-title">{t('completeprofile_title')}</h2>
          <p className="profile-subtitle">
            {t('completeprofile_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form" noValidate>
          {/* Address Section */}
          <div className="form-section">
            <h3 className="section-heading">{t('completeprofile_location_heading')}</h3>
            <p className="section-description">
              {t('completeprofile_location_desc')}
            </p>

            <AddressDropdown
              value={{
                region: formData.region,
                zone: formData.zone,
                woreda: formData.woreda,
                kebele: formData.kebele,
              }}
              onChange={handleAddressChange}
            />

            {touched.region && errors.region && (
              <div className="error-message">{errors.region}</div>
            )}
            {touched.zone && errors.zone && (
              <div className="error-message">{errors.zone}</div>
            )}
            {touched.woreda && errors.woreda && (
              <div className="error-message">{errors.woreda}</div>
            )}
          </div>

          {/* National ID Section */}
          <div className="form-section">
            <h3 className="section-heading">{t('completeprofile_id_heading')}</h3>
            <p className="section-description">
              {t('completeprofile_id_desc')}
            </p>

            <div className="form-group">
              <label htmlFor="fayidaId" className="form-label">
                {t('completeprofile_fayida_label')} <span className="required">*</span>
              </label>
              <input
                id="fayidaId"
                type="text"
                name="fayidaId"
                value={formData.fayidaId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${touched.fayidaId && errors.fayidaId ? 'error' : ''}`}
                data-error={!!errors.fayidaId}
                placeholder={t('completeprofile_fayida_placeholder')}
                maxLength="13"
                inputMode="numeric"
                required
              />
              <div className="field-hint">{t('completeprofile_fayida_hint')}</div>
              {touched.fayidaId && errors.fayidaId && (
                <div className="error-message">{errors.fayidaId}</div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                {t('completeprofile_submitting')}
              </>
            ) : (
              t('completeprofile_submit')
            )}
          </button>

          <p className="profile-note">
            {t('completeprofile_note')}
          </p>
        </form>
      </div>
    </div>
  );
}
