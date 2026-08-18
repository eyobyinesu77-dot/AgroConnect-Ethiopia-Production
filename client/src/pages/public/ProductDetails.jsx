import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { wishlistService } from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Rendered at both /marketplace/:id (public) and /buyer/marketplace/:id
 * (inside the buyer dashboard shell) — same component, same data, the
 * only difference is which layout wraps it (see routes/AppRoutes.jsx).
 * The "back" link and cart/wishlist actions all stay within whichever
 * context the page was reached from.
 */
export default function ProductDetails() {
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
        if (isMounted) setLoadError(error.response?.data?.message || 'Product not found.');
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
      toast('Please sign in as a buyer to purchase.', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyer accounts can purchase products.');
      return;
    }
    if (isSoldOut) {
      toast.error('This product is out of stock.');
      return;
    }
    addItem(product, quantity);
    toast.success(`"${product.name}" added to your cart.`);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast('Please sign in as a buyer to save items.', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyer accounts have a wishlist.');
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
      toast.error(error.response?.data?.message || 'Failed to update wishlist.');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading product..." />;
  }

  if (loadError || !product) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <p className="text-lg font-semibold text-gray-800 mb-2">Product not found</p>
        <p className="text-gray-500 mb-6">{loadError || "This product may have been removed."}</p>
        <Link to={marketplacePath} className="text-green-700 font-medium hover:underline">
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const locationLabel = [product.region, product.zone, product.woreda].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Link to={marketplacePath} className="text-sm text-green-700 font-medium hover:underline">
        ← Back to Marketplace
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
              Sold Out
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-[#166534]">
            {product.name}
            {product.variety && <span className="text-base font-normal text-gray-500"> ({product.variety})</span>}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded">{product.category}</span>
            {product.grade && (
              <span className="bg-yellow-50 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded">{product.grade}</span>
            )}
          </div>

          <p className="text-2xl font-bold text-gray-900">
            {product.price} ETB <span className="text-base font-normal text-gray-500">/ {product.unit || 'Quintal'}</span>
          </p>

          <p className="text-sm text-gray-600">
            {product.stock > 0 ? `${product.stock} ${product.unit || 'Quintal'} available` : 'Out of stock'}
          </p>

          {product.description && (
            <p className="text-gray-700 mt-2">{product.description}</p>
          )}

          <div className="border-t border-gray-100 mt-2 pt-3 text-sm text-gray-600 space-y-1">
            <p>👨‍🌾 Farmer: <span className="font-medium text-gray-800">{product.farmer?.fullName || 'Unknown'}</span></p>
            {locationLabel && <p>📍 Location: <span className="font-medium text-gray-800">{locationLabel}</span></p>}
            {product.expiryDate && (
              <p>📅 Best before: <span className="font-medium text-gray-800">{new Date(product.expiryDate).toLocaleDateString()}</span></p>
            )}
          </div>

          {!isSoldOut && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm text-gray-600">Quantity:</label>
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
              {isSoldOut ? 'Sold Out' : 'Add to Cart'}
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              className="px-4 py-3 border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 disabled:opacity-60"
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
