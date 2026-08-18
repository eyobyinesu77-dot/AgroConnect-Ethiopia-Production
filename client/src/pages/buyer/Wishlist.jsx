import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { wishlistService } from '../../services/wishlistService';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function BuyerWishlist() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const { addItem } = useCart();

  const loadWishlist = async () => {
    try {
      const data = await wishlistService.getWishlist();
      setItems(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load your wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await wishlistService.removeFromWishlist(productId);
      setItems((prev) => prev.filter((p) => p._id !== productId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove item.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`"${product.name}" added to cart.`);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading your wishlist..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1rem' }}>❤️ Wishlist</h2>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          <p>Your wishlist is empty.</p>
          <Link to="/buyer/marketplace" style={{ color: '#1b5e20', fontWeight: 'bold' }}>Browse the Marketplace</Link>
        </div>
      ) : (
        items.map((product) => (
          <div
            key={product._id}
            style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{product.name}</p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#777' }}>
                {product.farmer?.fullName || 'Unknown Farmer'} · {product.price?.toLocaleString()} ETB
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleAddToCart(product)}
                style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Add to Cart
              </button>
              <button
                onClick={() => handleRemove(product._id)}
                disabled={removingId === product._id}
                style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
