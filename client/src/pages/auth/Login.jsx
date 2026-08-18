// Login.jsx - Without Test Credentials
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { getPostLoginRedirectPath } from '../../utils/profileCompletion';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'email':
        if (!value) error = 'Email is required';
        break;
        
      case 'password':
        if (!value) error = 'Password is required';
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
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    let hasErrors = false;
    
    const requiredFields = ['email', 'password'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      const userData = {
        id: data._id,
        email: data.email,
        name: data.fullName,
        role: data.role,
        region: data.region,
        zone: data.zone,
        woreda: data.woreda,
        kebele: data.kebele,
        // fayidaId was previously dropped here, so isFarmerProfileComplete()
        // always saw a farmer as incomplete after login — even when the
        // profile (and Fayida ID) had already been saved to the database —
        // sending them back into the Complete Profile form on every
        // subsequent login and inviting a duplicate-key resubmission of the
        // same ID. Carry it through like every other profile field.
        fayidaId: data.fayidaId,
        mustChangePassword: !!data.mustChangePassword,
      };

      login(userData, data.token);

      toast.success('✅ Login successful! Welcome back! 🎉');

      if (data.mustChangePassword) {
        navigate('/change-password');
      } else {
        const redirectPath = getPostLoginRedirectPath(userData);
        navigate(redirectPath);
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      const message = !error.response
        ? '⚠️ Cannot reach the server. Make sure the backend is running and try again.'
        : error.response?.data?.message || '❌ Login failed. Please check your credentials.';
      toast.error(message);
      setFormData(prev => ({ ...prev, password: '' }));
      document.getElementById('password')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">🔐 Sign In</h2>
        
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              📧 Email <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
              data-error={!!errors.email}
              required
              autoComplete="email"
            />
            {touched.email && errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 Password <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                data-error={!!errors.password}
                required
                minLength="8"
                autoComplete="current-password"
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
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="register-link">
          Don't have an account? <Link to="/register" className="link">Create Account</Link>
        </p>
      </div>
    </div>
  );
}