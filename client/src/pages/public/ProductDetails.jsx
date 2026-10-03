import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { wishlistService } from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { tOr, unitKey, apiErrorKey, dataLabel, geoJoin } from '../../utils/i18nKeys';

/**
 * Rendered at both /marketplace/:id (public) and /buyer/marketplace/:id
 * (inside the buyer dashboard shell) — same component, same data, the
 * only difference is which layout wraps it (see routes/AppRoutes.jsx).
 * The "back" link and cart/wishlist actions all stay within whichever
 * context the page was reached from.
 */
export default function ProductDetails() {
  const { t, formatNumber, formatDate } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem } = useCart();

  const isBuyerDashboard = location.pathname.startsWith('/buyer');
  const marketplacePath = isBuyerDashboard ? '/buyer/marketplace' : '/marketplace';

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    productService.getProductById(id)
      .then((data) => {
        if (isMounted) setProduct(data);
      })
      .catch((error) => {
        if (isMounted) setLoadError(t(apiErrorKey(error, 'pd_not_found', 'pd_not_found')));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Wishlist state only applies to logged-in buyers.
    if (user?.role === 'buyer') {
      wishlistService.getWishlist()
        .then((items) => {
          if (isMounted) setIsWishlisted(items.some((item) => item._id === id));
        })
        .catch(() => {}); // non-critical — wishlist heart just won't pre-fill
    }

    return () => { isMounted = false; };
  }, [id, user]);

  const isSoldOut = product?.listingStatus === 'Sold Out' || (product?.stock ?? 0) < 1;

  const handleAddToCart = () => {
    if (!user) {
      toast(t('mkt_signin_purchase'), { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error(t('mkt_buyer_only_purchase'));
      return;
    }
    if (isSoldOut) {
      toast.error(t('mkt_out_of_stock'));
      return;
    }
    addItem(product, quantity);
    toast.success(t('mkt_added_to_cart').replace('{name}', product.name));
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast(t('mkt_signin_wishlist'), { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error(t('mkt_buyer_only_wishlist'));
      return;
    }

    setIsTogglingWishlist(true);
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(id);
        setIsWishlisted(false);
      } else {
        await wishlistService.addToWishlist(id);
        setIsWishlisted(true);
      }
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'mkt_wishlist_update_error', 'mkt_wishlist_update_error')));
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('pd_loading')} />;
  }

  if (loadError || !product) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <p className="text-lg font-semibold text-gray-800 mb-2">{t('pd_not_found_title')}</p>
        <p className="text-gray-500 mb-6">{loadError || t('pd_removed_note')}</p>
        <Link to={marketplacePath} className="text-green-700 font-medium hover:underline">
          {t('pd_back_to_marketplace')}
        </Link>
      </div>
    );
  }

  const locationLabel = geoJoin(t, [product.region, product.zone, product.woreda], ', ');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Link to={marketplacePath} className="text-sm text-green-700 font-medium hover:underline">
        {t('pd_back_to_marketplace')}
      </Link>

      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden grid md:grid-cols-2">
        <div className="bg-green-50 flex items-center justify-center text-8xl h-64 md:h-full relative overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <span style={{ display: product.image ? 'none' : 'block' }}>🌾</span>
          {isSoldOut && (
            <span className="absolute bottom-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
              {t('pc_sold_out')}
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-[#166534]">
            {dataLabel(t, 'crop', product.name)}
            {product.variety && <span className="text-base font-normal text-gray-500"> ({product.variety})</span>}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded">{dataLabel(t, 'category', product.category)}</span>
            {product.grade && (
              <span className="bg-yellow-50 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded">{dataLabel(t, 'grade', product.grade)}</span>
            )}
          </div>

          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(product.price)} {t('unit_etb')} <span className="text-base font-normal text-gray-500">/ {tOr(t, unitKey(product.unit || 'Quintal'), product.unit || 'Quintal')}</span>
          </p>

          <p className="text-sm text-gray-600">
            {product.stock > 0 ? t('pd_stock_available').replace('{stock}', formatNumber(product.stock)).replace('{unit}', dataLabel(t, 'unit', product.unit || 'Quintal')) : t('pd_out_of_stock')}
          </p>

          {product.description && (
            <p className="text-gray-700 mt-2">{product.description}</p>
          )}

          <div className="border-t border-gray-100 mt-2 pt-3 text-sm text-gray-600 space-y-1">
            <p>👨‍🌾 {t('pc_farmer_label').split(':')[0]}: <span className="font-medium text-gray-800">{product.farmer?.fullName || t('admin_orders_unknown')}</span></p>
            {locationLabel && <p>📍 {t('pc_location_label').split(':')[0]}: <span className="font-medium text-gray-800">{locationLabel}</span></p>}
            {product.expiryDate && (
              <p>{t('pd_best_before')} <span className="font-medium text-gray-800">{formatDate(product.expiryDate)}</span></p>
            )}
          </div>

          {!isSoldOut && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm text-gray-600">{t('pd_quantity')}</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg"
            >
              {isSoldOut ? t('pc_sold_out') : t('pc_add_to_cart')}
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              className="px-4 py-3 border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 disabled:opacity-60"
              title={isWishlisted ? t('pc_remove_wishlist') : t('pc_add_wishlist')}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
