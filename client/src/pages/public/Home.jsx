import { Link } from 'react-router-dom';
import { Sprout, ShoppingBasket, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const features = [
  {
    icon: Sprout,
    titleKey: 'home_card_farmers_title',
    descriptionKey: 'home_card_farmers_text',
  },
  {
    icon: ShoppingBasket,
    titleKey: 'home_card_buyers_title',
    descriptionKey: 'home_card_buyers_text',
  },
  {
    icon: Users,
    titleKey: 'home_card_ext_title',
    descriptionKey: 'home_card_ext_text',
  },
];

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="w-full min-h-screen bg-[#f9fafb] flex flex-col justify-between">
      <div className="w-full">
        {/* Hero Section — Ethiopian agricultural marketplace image as background
            with dark overlay for text readability. Image shows farmer-buyer
            handshake, fresh produce, mountains, and local marketplace. */}
        <section
          className="relative w-full flex items-center justify-center min-h-[420px] sm:min-h-[480px] md:min-h-[560px] lg:min-h-[620px] py-20 md:py-28 px-4 md:px-8 text-center overflow-hidden bg-cover bg-center bg-no-repeat bg-[url('/images/hero-marketplace.png')]"
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/45"></div>

          {/* Hero content with white/light text */}
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg leading-tight">
              {t('home_hero_title')}
            </h1>
            <p className="text-white/95 mb-8 text-base sm:text-lg drop-shadow-md max-w-2xl mx-auto">
              {t('home_hero_text')}
            </p>
            <Link
              to="/register"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base sm:text-lg px-8 py-3 rounded-lg shadow-lg transition-colors"
            >
              {t('home_get_started')}
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto py-16 px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-[#166534]">
            {t('home_features_title')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('home_features_text')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map(({ icon: Icon, titleKey, descriptionKey }) => (
              <div
                key={titleKey}
                className="p-8 border border-green-200 rounded-xl shadow-sm bg-white text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-emerald-700" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#166534]">{t(titleKey)}</h3>
                <p className="text-gray-600 text-sm">{t(descriptionKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
