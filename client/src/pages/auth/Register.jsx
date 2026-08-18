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
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
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
        if (!value) error = 'Email is required';
        else if (!validateEmail(value)) error = 'Please enter a valid email address';
        break;
        
      case 'phone':
        if (!value) {
          error = 'Phone number is required';
        } else if (!validatePhoneNumber(value)) {
          error = 'Please enter a valid Ethiopian phone number (e.g. 09xxxxxxxx or +2519xxxxxxxx)';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(value)) {
          error = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(value)) {
          error = 'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(value)) {
          error = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*]/.test(value)) {
          error = 'Password must contain at least one special character';
        }
        break;
        
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== formData.password) error = 'Passwords do not match';
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

      toast.success('✅ Registration successful! Welcome aboard! 🎉');

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      console.error('❌ Registration error:', error);
      const message = !error.response
        ? '⚠️ Cannot reach the server. Make sure the backend is running and try again.'
        : error.response?.data?.message || '❌ Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = validatePasswordStrength(formData.password);

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">📝 Create New Account</h2>
        
        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {/* Email - No placeholder */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              📧 Email <span className="required">*</span>
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
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              📱 Phone Number <span className="required">*</span>
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
              placeholder="09xxxxxxxx or +2519xxxxxxxx"
              maxLength="13"
              required
            />
            {touched.phone && errors.phone && (
              <div className="error-message">{errors.phone}</div>
            )}
          </div>

          {/* User Type */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              👥 User Type <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="farmer">👨‍🌾 Farmer</option>
              <option value="buyer">🛒 Buyer</option>
            </select>
            {formData.role === 'farmer' && (
              <div className="form-hint">
                💡 After registration, you'll complete your farm location and ID details.
              </div>
            )}
          </div>



          {/* Password - No placeholder */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 Password <span className="required">*</span>
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {touched.password && errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
            {passwordStrength && formData.password && (
              <div className="password-strength">
                Password strength: 
                <span className={`strength-${passwordStrength}`}>
                  {passwordStrength === 'strong' && ' 💪 Strong'}
                  {passwordStrength === 'medium' && ' ⚡ Medium'}
                  {passwordStrength === 'weak' && ' 🟡 Weak'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password - No placeholder */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              🔒 Confirm Password <span className="required">*</span>
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
              <div className="error-message">{errors.confirmPassword}</div>
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
                Registering...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login" className="link">Sign In</Link>
        </p>
      </div>
    </div>
  );
}