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
    <div className="w-full min-h-screen bg-[#f8faf8] flex flex-col">
      {/* Hero Section */}
      <section
        className="relative w-full flex items-center justify-center min-h-[480px] sm:min-h-[540px] md:min-h-[600px] py-16 md:py-24 px-4 md:px-8 text-center overflow-hidden bg-cover bg-center bg-no-repeat bg-[url('/images/hero-marketplace.png')]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-emerald-900/50" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold mb-5 text-white drop-shadow-lg leading-tight tracking-tight">
            {t('home_hero_title')}
          </h1>
          <p className="text-white/95 mb-8 text-base sm:text-lg md:text-xl drop-shadow-md max-w-2xl mx-auto leading-relaxed">
            {t('home_hero_text')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-7 py-3 rounded-lg shadow-lg transition-colors"
            >
              {t('home_cta_marketplace') || 'Explore Marketplace'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-emerald-800 font-semibold text-base px-7 py-3 rounded-lg shadow-lg transition-colors"
            >
              {t('home_get_started') || 'Join AgroConnect'}
            </Link>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section className="max-w-7xl mx-auto w-full py-14 md:py-20 px-4 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#166534]">
              {t('home_marketplace_title') || 'Fresh from Ethiopian Farms'}
            </h2>
            <p className="text-gray-600 mt-1 max-w-xl">
              {t('home_marketplace_text') || 'Browse real agricultural products listed by local farmers.'}
            </p>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold text-sm shrink-0"
          >
            {t('home_view_all') || 'View all products'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingProducts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingProducts && productsError && (
          <p className="text-center text-gray-500 py-8">
            {t('home_products_error') || 'Unable to load products right now. Please try the marketplace.'}
          </p>
        )}

        {!loadingProducts && !productsError && products.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {t('home_products_empty') || 'No products available yet. Check back soon.'}
          </p>
        )}

        {!loadingProducts && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => {
              const id = product._id || product.id;
              const name = product.name || product.cropName || product.title || 'Product';
              const price = product.pricePerUnit ?? product.price;
              const unit = product.unit || 'kg';
              const img = product.image || product.images?.[0] || '/images/hero-marketplace.png';
              const isSoldOut = product.listingStatus === 'Sold Out' || (product.stock ?? 1) < 1;
              return (
                <Link
                  key={id}
                  to={`/marketplace/${id}`}
                  className={`block bg-white rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${isSoldOut ? 'opacity-60' : ''}`}
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.src = '/images/hero-marketplace.png'; }} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#166534] text-base truncate">{name}</h3>
                    {price != null && (
                      <p className="text-emerald-700 font-bold mt-1">
                        {typeof price === 'number' ? price.toLocaleString() : price} ETB / {unit}
                      </p>
                    )}
                    {isSoldOut && <span className="text-xs text-red-600 font-medium">Sold out</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-white border-y border-green-100">
        <div className="max-w-7xl mx-auto py-14 md:py-20 px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-[#166534]">
            {t('home_features_title')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('home_features_text')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, titleKey, descriptionKey }) => (
              <div
                key={titleKey}
                className="p-6 border border-green-100 rounded-xl bg-[#f8faf8] hover:shadow-md hover:border-green-200 transition-all"
              >
                <div className="w-12 h-12 mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-bold text-base mb-1.5 text-[#166534]">{t(titleKey)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto w-full py-14 md:py-20 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-[#166534]">
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
                <Icon className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#166534]">{t(titleKey)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(descriptionKey)}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors"
          >
            {t('home_get_started') || 'Join AgroConnect'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
