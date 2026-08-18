import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import ProductCard from "../../components/common/ProductCard";
import { Search } from "lucide-react";
import { productService } from "../../services/productService";
import { wishlistService } from "../../services/wishlistService";
import { categoryService } from "../../services/categoryService";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categoryNames, setCategoryNames] = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // This same component renders at both the public /marketplace route and
  // /buyer/marketplace (inside the buyer dashboard shell). Product Details
  // must stay within whichever context it was reached from, rather than
  // always linking to the public route.
  const detailsBasePath = location.pathname.startsWith('/buyer') ? '/buyer/marketplace' : '/marketplace';

  const loadMarketplace = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [data, categories] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(data);
      setCategoryNames(categories.map((c) => c.name));
    } catch (error) {
      // Distinguish "the server responded with an error" from "the request
      // never reached the server at all" — the latter (error.response is
      // undefined) almost always means the backend isn't running or isn't
      // reachable, which needs a very different message than a normal
      // application error.
      const message = !error.response
        ? 'Cannot reach the server. Please check that the backend is running and try again.'
        : error.response?.data?.message || 'Failed to load the marketplace.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      await loadMarketplace();

      if (!isMounted) return;

      if (user?.role === 'buyer') {
        try {
          const wishlist = await wishlistService.getWishlist();
          if (isMounted) setWishlistedIds(new Set(wishlist.map((p) => p._id)));
        } catch {
          // Non-critical — the heart icons just won't be pre-filled.
        }
      }
    })();

    return () => { isMounted = false; };
  }, [user]);

  const searchedProducts = useMemo(
    () => products.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  // Group products into one horizontally-scrolling row per category, ordered
  // by the real Category collection (admin-managed), plus any category value
  // that shows up in product data but isn't in that list for some reason
  // (e.g. a category was deleted after products were already tagged with it).
  const rows = useMemo(() => {
    const extraCategories = [...new Set(searchedProducts.map((p) => p.category))].filter(
      (c) => c && !categoryNames.includes(c)
    );
    const orderedCategories = [...categoryNames, ...extraCategories];

    return orderedCategories
      .map((category) => ({
        category,
        items: searchedProducts.filter((p) => p.category === category),
      }))
      .filter((row) => row.items.length > 0);
  }, [searchedProducts, categoryNames]);

  // Shared eligibility check for both Add to Cart and Buy Now — same
  // validation, different action afterward.
  const validatePurchase = (product) => {
    if (!user) {
      toast('Please sign in as a buyer to purchase.', { icon: '🔒' });
      navigate('/login');
      return false;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyer accounts can purchase products.');
      return false;
    }
    if (product.stock < 1 || product.listingStatus === 'Sold Out') {
      toast.error('This product is out of stock.');
      return false;
    }
    return true;
  };

  // Add to Cart: adds the item and stays on the Marketplace so the buyer
  // can keep browsing. Never navigates, never places an order.
  const handleAddToCart = (product) => {
    if (!validatePurchase(product)) return;
    addItem(product, 1);
    toast.success(`"${product.name}" added to your cart.`);
  };

  // Buy Now: a distinct action from Add to Cart — adds the item via the
  // SAME addItem() call (reusing CartContext, not duplicating cart/order
  // logic), then immediately routes into the existing checkout flow
  // (client/src/pages/buyer/Checkout.jsx, unchanged) instead of leaving
  // the buyer on the Marketplace.
  const handleBuyNow = (product) => {
    if (!validatePurchase(product)) return;
    addItem(product, 1);
    navigate('/buyer/checkout');
  };

  const handleWishlist = async (product) => {
    if (!user) {
      toast('Please sign in as a buyer to save items.', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyer accounts have a wishlist.');
      return;
    }

    const isWishlisted = wishlistedIds.has(product._id);
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product._id);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(product._id);
          return next;
        });
      } else {
        await wishlistService.addToWishlist(product._id);
        setWishlistedIds((prev) => new Set(prev).add(product._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading the marketplace..." />;
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Couldn't load the marketplace</h2>
        <p className="text-gray-600 mb-6">{loadError}</p>
        <button
          onClick={loadMarketplace}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Agricultural Marketplace 🌾</h1>
        <p className="text-gray-600">Source quality crops directly from verified Ethiopian farmers.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-md">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search crops (Teff, Coffee, Wheat...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      {/* Horizontal category rows */}
      {rows.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="text-lg">No products match your search yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {rows.map((row) => (
            <section key={row.category}>
              <h2 className="text-xl font-bold text-gray-800 mb-3">{row.category}</h2>
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollSnapType: 'x proximity' }}>
                {row.items.map((product) => (
                  <div key={product._id} style={{ scrollSnapAlign: 'start' }}>
                    <ProductCard
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                      onBuyNow={() => handleBuyNow(product)}
                      onWishlist={() => handleWishlist(product)}
                      onViewDetails={() => navigate(`${detailsBasePath}/${product._id}`)}
                      isWishlisted={wishlistedIds.has(product._id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
