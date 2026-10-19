import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B1420] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-[#8EE0BC] mb-3">
              Explore
            </h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/" className="text-[#D5E7DF] hover:text-white transition-colors">
                  {t('pubnav_home') || 'Home'}
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-[#D5E7DF] hover:text-white transition-colors">
                  {t('pubnav_marketplace') || 'Marketplace'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#D5E7DF] hover:text-white transition-colors">
                  {t('pubnav_about') || 'About'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#D5E7DF] hover:text-white transition-colors">
                  {t('pubnav_contact') || 'Contact'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-[#8EE0BC] mb-3">
              Account
            </h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/login" className="text-[#D5E7DF] hover:text-white transition-colors">
                  {t('pubnav_login') || 'Login'}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#D5E7DF] hover:text-white transition-colors">
                  {t('pubnav_register') || 'Register'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 pt-4 text-center text-sm text-[#D5E7DF]">
          {t('footer_copyright') || '© 2026 AgroConnect Ethiopia. All rights reserved.'}
        </div>
      </div>
    </footer>
  );
}
