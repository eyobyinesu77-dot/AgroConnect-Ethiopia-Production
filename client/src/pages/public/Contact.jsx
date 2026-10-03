import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Send } from 'lucide-react';
import { supportService } from '../../services/supportService';
import { useAuth } from '../../context/AuthContext';
import { supportCategories, languageOptions } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey, dataLabel } from '../../utils/i18nKeys';

export default function Contact() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [msg, setMsg] = useState({
    guestEmail: '',
    phone: '',
    subject: '',
    category: 'General Inquiry',
    language: 'English',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user && !msg.guestEmail.trim()) {
      toast.error(t('contact_err_email'));
      return;
    }
    if (!msg.subject.trim()) {
      toast.error(t('contact_err_subject'));
      return;
    }
    if (!msg.message.trim()) {
      toast.error(t('contact_err_message'));
      return;
    }

    setIsSubmitting(true);
    try {
      await supportService.createTicket({
        subject: msg.subject.trim(),
        phone: msg.phone.trim() || undefined,
        category: msg.category,
        language: msg.language,
        message: msg.message.trim(),
        guestEmail: msg.guestEmail.trim() || undefined,
      });
      toast.success(t('contact_sent'));
      setMsg({ guestEmail: '', phone: '', subject: '', category: 'General Inquiry', language: 'English', message: '' });
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'contact_err_send', 'contact_err_send')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent';

  return (
    <div className="bg-green-50 min-h-[85vh]">
      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">{t('contact_title')}</h1>
          <p className="text-gray-600 mb-8">
            {t('contact_intro')}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </span>
              {t('contact_location')}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 space-y-4">
          {!user && (
            <>
              <input
                type="email"
                placeholder={t('auth_email_plain')}
                value={msg.guestEmail}
                onChange={(e) => setMsg({ ...msg, guestEmail: e.target.value })}
                required
                className={inputClass}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label={t('contact_category_label')}
              value={msg.category}
              onChange={(e) => setMsg({ ...msg, category: e.target.value })}
              className={inputClass}
            >
              {supportCategories.map((c) => (
                <option key={c} value={c}>{dataLabel(t, 'support_category', c)}</option>
              ))}
            </select>
            <select
              aria-label={t('contact_language_label')}
              value={msg.language}
              onChange={(e) => setMsg({ ...msg, language: e.target.value })}
              className={inputClass}
            >
              {languageOptions.map((l) => (
                <option key={l} value={l}>{dataLabel(t, 'support_language', l)}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder={t('contact_subject_placeholder')}
            value={msg.subject}
            onChange={(e) => setMsg({ ...msg, subject: e.target.value })}
            required
            className={inputClass}
          />

          <input
            type="tel"
            placeholder={t('contact_phone_placeholder')}
            value={msg.phone}
            onChange={(e) => setMsg({ ...msg, phone: e.target.value })}
            className={inputClass}
          />

          <textarea
            placeholder={t('contact_message_placeholder')}
            rows="4"
            value={msg.message}
            onChange={(e) => setMsg({ ...msg, message: e.target.value })}
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? t('contact_sending') : <>{t('contact_send')} <Send className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
