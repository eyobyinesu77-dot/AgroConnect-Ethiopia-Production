import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import { supportService } from '../../services/supportService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey } from '../../utils/i18nKeys';

export default function Contact() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [msg, setMsg] = useState({
    guestEmail: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = (user?.email || msg.guestEmail || '').trim();
    if (!email) {
      toast.error(t('contact_err_email') || 'Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('auth_err_email_invalid') || 'Please enter a valid email address.');
      return;
    }
    if (!msg.subject.trim()) {
      toast.error(t('contact_err_subject') || 'Please enter a subject.');
      return;
    }
    if (!msg.message.trim()) {
      toast.error(t('contact_err_message') || 'Please enter a message.');
      return;
    }

    setIsSubmitting(true);
    try {
      await supportService.createTicket({
        subject: msg.subject.trim(),
        category: 'General Inquiry',
        language: 'English',
        message: msg.message.trim(),
        guestEmail: user ? undefined : email,
      });
      toast.success(t('contact_sent') || 'Your message has been sent.');
      setMsg({ guestEmail: '', subject: '', message: '' });
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
      <div className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-3 text-center">
          {t('contact_title') || 'Contact Us'}
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          {t('contact_intro') || 'Send us a message and we will get back to you.'}
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-green-100 p-6 md:p-8 space-y-4">
          {!user && (
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth_email_plain') || 'Email Address'} <span className="text-red-600">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder={t('auth_email_plain') || 'Email Address'}
                value={msg.guestEmail}
                onChange={(e) => setMsg({ ...msg, guestEmail: e.target.value })}
                required
                className={inputClass}
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
              {t('contact_subject_placeholder') || 'Subject'} <span className="text-red-600">*</span>
            </label>
            <input
              id="contact-subject"
              type="text"
              placeholder={t('contact_subject_placeholder') || 'Subject'}
              value={msg.subject}
              onChange={(e) => setMsg({ ...msg, subject: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
              {t('contact_message_placeholder') || 'Message'} <span className="text-red-600">*</span>
            </label>
            <textarea
              id="contact-message"
              placeholder={t('contact_message_placeholder') || 'Message'}
              rows="5"
              value={msg.message}
              onChange={(e) => setMsg({ ...msg, message: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? (t('contact_sending') || 'Sending...') : <>{t('contact_send') || 'Send Message'} <Send className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
