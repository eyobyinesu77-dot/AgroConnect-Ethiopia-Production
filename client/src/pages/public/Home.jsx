import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShoppingBasket,
  Users,
  Truck,
  CloudSun,
  GraduationCap,
  ArrowRight,
  Leaf,
  Package,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { productService } from '../../services/productService';
import ProductCard from '../../components/common/ProductCard';

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
  {
    icon: Truck,
    titleKey: 'home_feature_logistics_title',
    descriptionKey: 'home_feature_logistics_text',
  },
  {
    icon: CloudSun,
    titleKey: 'home_feature_weather_title',
    descriptionKey: 'home_feature_weather_text',
  },
  {
    icon: GraduationCap,
    titleKey: 'home_feature_training_title',
    descriptionKey: 'home_feature_training_text',
  },
];

const steps = [
  {
    num: '1',
    titleKey: 'home_step1_title',
    descriptionKey: 'home_step1_text',
    icon: Leaf,
  },
  {
    num: '2',
    titleKey: 'home_step2_title',
    descriptionKey: 'home_step2_text',
    icon: Package,
  },
  {
    num: '3',
    titleKey: 'home_step3_title',
    descriptionKey: 'home_step3_text',
    icon: Truck,
  },
];

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingProducts(true);
        setProductsError(false);
        const data = await productService.getAllProducts({ limit: 6, status: 'available' });
        const list = Array.isArray(data) ? data : data?.products || data?.data || [];
        if (!cancelled) setProducts(list.slice(0, 6));
      } catch {
        if (!cancelled) {
          setProductsError(true);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F3F7F5] flex flex-col">
      {/* Hero Section */}
      <section
        className="relative w-full min-h-[42vh] md:min-h-[48vh] lg:min-h-[52vh] flex items-center justify-start px-4 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-16 text-left overflow-hidden bg-cover bg-center bg-no-repeat bg-[url('/images/hero-marketplace.png')]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#071D15]/80 via-[#071D15]/45 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <h1 className="max-w-2xl text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold mb-4 text-white drop-shadow-lg leading-tight tracking-tight">
            {t('home_hero_title')}
          </h1>
          <p className="text-white/95 mb-6 text-base sm:text-lg md:text-xl drop-shadow-md max-w-xl mx-0 leading-relaxed">
            {t('home_hero_text')}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-3 sm:gap-4">
            <Link
              to="/marketplace"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-[#087F5B] hover:bg-[#066647] text-white font-semibold text-base px-6 sm:px-7 py-3 rounded-lg shadow-lg transition-colors"
            >
              {t('home_cta_marketplace') || 'Explore Marketplace'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-white/95 hover:bg-white text-[#0B1420] font-semibold text-base px-6 sm:px-7 py-3 rounded-lg shadow-lg transition-colors"
            >
              {t('home_get_started') || 'Join AgroConnect'}
            </Link>
          </div>
        </div>
      </section>



      {/* Features */}
      <section className="bg-white border-y border-[#087F5B]/20">
        <div className="max-w-7xl mx-auto py-14 md:py-20 px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-[#0B1420]">
            {t('home_features_title')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('home_features_text')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, titleKey, descriptionKey }) => (
              <div
                key={titleKey}
                className="p-6 border border-[#087F5B]/20 rounded-xl bg-[#F3F7F5] hover:shadow-md hover:border-[#087F5B]/40 transition-all"
              >
                <div className="w-12 h-12 mb-4 rounded-full bg-[#087F5B]/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#087F5B]" />
                </div>
                <h3 className="font-bold text-base mb-1.5 text-[#0B1420]">{t(titleKey)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto w-full py-14 md:py-20 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-[#0B1420]">
          {t('home_how_title') || 'How It Works'}
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          {t('home_how_text') || 'A simple path from farm to buyer.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ num, titleKey, descriptionKey, icon: Icon }) => (
            <div key={num} className="relative text-center px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                {num}
              </div>
              <div className="flex justify-center mb-2">
                <Icon className="w-5 h-5 text-[#087F5B]" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#0B1420]">{t(titleKey)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(descriptionKey)}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#087F5B] hover:bg-[#066647] text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors"
          >
            {t('home_get_started') || 'Join AgroConnect'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
