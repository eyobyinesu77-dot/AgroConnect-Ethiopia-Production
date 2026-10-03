import React from 'react';
import { Sprout, Target, Users2, Handshake } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const pillars = [
  {
    icon: Target,
    titleKey: 'about_pillar_mission_title',
    textKey: 'about_pillar_mission_text',
  },
  {
    icon: Users2,
    titleKey: 'about_pillar_community_title',
    textKey: 'about_pillar_community_text',
  },
  {
    icon: Handshake,
    titleKey: 'about_pillar_trust_title',
    textKey: 'about_pillar_trust_text',
  },
];

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="bg-green-50 min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-green-100 rounded-full px-4 py-1.5 text-sm text-green-700 font-medium mb-6">
          <Sprout className="h-4 w-4" />
          {t('about_badge')}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">{t('about_title')}</h1>
        <p className="text-gray-600 leading-relaxed text-lg mb-12">
          <b className="text-green-800">{t('about_brand_name')}</b>{t('about_body')}
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, titleKey, textKey }) => (
            <div key={titleKey} className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="h-11 w-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t(titleKey)}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t(textKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
