import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { supportService } from '../../services/supportService';
import { useAuth } from '../../context/AuthContext';
import { supportCategories, languageOptions } from '../../utils/constants';

export default function Contact() {
  const { user } = useAuth();
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
      toast.error('Please enter your email.');
      return;
    }
    if (!msg.subject.trim()) {
      toast.error('Please enter a subject.');
      return;
    }
    if (!msg.message.trim()) {
      toast.error('Please enter a message.');
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
      toast.success('Your message has been sent! Thank you.');
      setMsg({ guestEmail: '', phone: '', subject: '', category: 'General Inquiry', language: 'English', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send your message. Please try again.');
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">📞 Contact Us</h1>
          <p className="text-gray-600 mb-8">
            If you have a question or feedback, send us a message and we'll respond as soon as possible.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <Phone className="h-4 w-4" />
              </span>
              +251 900 000 000
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <Mail className="h-4 w-4" />
              </span>
              support@agroconnect.et
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </span>
              Addis Ababa, Ethiopia
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 space-y-4">
          {!user && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={msg.guestEmail}
                onChange={(e) => setMsg({ ...msg, guestEmail: e.target.value })}
                required
                className={inputClass}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select
              value={msg.category}
              onChange={(e) => setMsg({ ...msg, category: e.target.value })}
              className={inputClass}
            >
              {supportCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={msg.language}
              onChange={(e) => setMsg({ ...msg, language: e.target.value })}
              className={inputClass}
            >
              {languageOptions.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Subject"
            value={msg.subject}
            onChange={(e) => setMsg({ ...msg, subject: e.target.value })}
            required
            className={inputClass}
          />

          <input
            type="tel"
            placeholder="Phone Number — optional"
            value={msg.phone}
            onChange={(e) => setMsg({ ...msg, phone: e.target.value })}
            className={inputClass}
          />

          <textarea
            placeholder="Your message..."
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
            {isSubmitting ? 'Sending...' : <>Send <Send className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
