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
    <div className="w-full bg-[#F3F7F5] flex flex-col">
      {/* Compact Horizontal Hero */}
      <section className="w-full bg-[#F3F7F5] px-4 py-6 sm:px-8 md:py-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl bg-white p-5 shadow-sm sm:p-7 md:grid-cols-[1.05fr_0.95fr] md:gap-8 lg:p-9">
          <div className="flex flex-col items-start text-left">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-[#087F5B]">
              <Sprout className="h-4 w-4" />
              AgroConnect Ethiopia
            </span>
            <h1 className="mb-3 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#123126] sm:text-4xl lg:text-5xl">
              {t('home_hero_title')}
            </h1>
            <p className="mb-5 max-w-xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
              {t('home_hero_text')}
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087F5B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#066647]"
              >
                {t('home_cta_marketplace') || 'Explore Marketplace'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg border border-[#087F5B]/25 bg-white px-5 py-3 text-sm font-semibold text-[#087F5B] transition-colors hover:bg-emerald-50"
              >
                {t('home_get_started') || 'Join AgroConnect'}
              </Link>
            </div>
          </div>
          <div
            role="img"
            aria-label="Ethiopian farmers and buyers connecting at a local agricultural market"
            className="min-h-[190px] w-full rounded-xl bg-cover bg-center bg-no-repeat sm:min-h-[230px] md:min-h-[280px]"
            style={{ backgroundImage: "url('/images/hero-marketplace.png')" }}
          />
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
