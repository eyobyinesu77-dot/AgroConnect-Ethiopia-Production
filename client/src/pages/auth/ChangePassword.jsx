import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey } from '../../utils/i18nKeys';

export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dashboardPath = {
    farmer: '/farmer/dashboard',
    buyer: '/buyer/dashboard',
    extension: '/extension/dashboard',
    admin: '/admin/dashboard',
  }[user?.role] || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error(t('change_err_min6'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth_passwords_mismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(newPassword);
      updateUser({ mustChangePassword: false });
      toast.success(t('change_success'));
      navigate(dashboardPath);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'change_failed', 'change_failed')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-800 mb-2">{t('change_title')}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {user?.mustChangePassword
            ? t('change_must')
            : t('change_update')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth_new_password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('change_confirm_new')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg"
          >
            {isLoading ? t('change_submitting') : t('change_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
