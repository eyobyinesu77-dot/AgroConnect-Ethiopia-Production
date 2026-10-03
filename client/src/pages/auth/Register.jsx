// Register.jsx - Without Sample Placeholders (English)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  validateEmail,
  validatePhoneNumber,
  validatePasswordStrength,
} from '../../utils/validation';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey } from '../../utils/i18nKeys';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'email':
        if (!value) error = 'auth_err_email_required';
        else if (!validateEmail(value)) error = 'val_email_invalid';
        break;
        
      case 'phone':
        if (!value) {
          error = 'val_phone_required';
        } else if (!validatePhoneNumber(value)) {
          error = 'val_phone_format';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'auth_err_password_required';
        } else if (value.length < 8) {
          error = 'val_password_min8';
        } else if (!/[A-Z]/.test(value)) {
          error = 'val_password_upper';
        } else if (!/[a-z]/.test(value)) {
          error = 'val_password_lower';
        } else if (!/[0-9]/.test(value)) {
          error = 'val_password_number';
        } else if (!/[!@#$%^&*]/.test(value)) {
          error = 'val_password_special';
        }
        break;
        
      case 'confirmPassword':
        if (!value) error = 'val_confirm_required';
        else if (value !== formData.password) error = 'val_passwords_mismatch';
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
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (name === 'phone') {
      const sanitized = value.replace(/[^\d+]/g, '');
      setFormData({ ...formData, [name]: sanitized });
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    const newErrors = {};
    let hasErrors = false;
    
    const requiredFields = ['email', 'phone', 'password', 'confirmPassword'];
    
    requiredFields.forEach(field => {
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

    setIsLoading(true);

    try {
      const userData = {
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };

      await authService.register(userData);

      toast.success(t('register_success'));

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error(t(apiErrorKey(error, 'register_failed')));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = validatePasswordStrength(formData.password);

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">{t('register_title')}</h2>
        
        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {/* Email - No placeholder */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('login_email_label')} <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
              data-error={!!errors.email}
              required
            />
            {touched.email && errors.email && (
              <div className="error-message">{t(errors.email)}</div>
            )}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              {t('register_phone_label')} <span className="required">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.phone && errors.phone ? 'error' : ''}`}
              data-error={!!errors.phone}
              maxLength="13"
              required
            />
            {touched.phone && errors.phone && (
              <div className="error-message">{t(errors.phone)}</div>
            )}
          </div>

          {/* User Type */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              {t('register_role_label')} <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="farmer">{t('register_role_farmer')}</option>
              <option value="buyer">{t('register_role_buyer')}</option>
            </select>
            {formData.role === 'farmer' && (
              <div className="form-hint">
                {t('register_farmer_hint')}
              </div>
            )}
          </div>



          {/* Password - No placeholder */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('login_password_label')} <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                data-error={!!errors.password}
                required
                minLength="8"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? t('a11y_hide_password') : t('a11y_show_password')}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {touched.password && errors.password && (
              <div className="error-message">{t(errors.password)}</div>
            )}
            {passwordStrength && formData.password && (
              <div className="password-strength">
                {t('register_strength')}{' '}
                <span className={`strength-${passwordStrength}`}>
                  {passwordStrength === 'strong' && t('register_strength_strong')}
                  {passwordStrength === 'medium' && t('register_strength_medium')}
                  {passwordStrength === 'weak' && t('register_strength_weak')}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password - No placeholder */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {t('register_confirm_label')} <span className="required">*</span>
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.confirmPassword && errors.confirmPassword ? 'error' : ''}`}
              data-error={!!errors.confirmPassword}
              required
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="error-message">{t(errors.confirmPassword)}</div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {t('register_submitting')}
              </>
            ) : (
              t('register_submit')
            )}
          </button>
        </form>

        <p className="login-link">
          {t('register_have_account')} <Link to="/login" className="link">{t('login_submit')}</Link>
        </p>
      </div>
    </div>
  );
}