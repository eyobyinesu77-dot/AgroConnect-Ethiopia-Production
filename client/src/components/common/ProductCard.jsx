import React from 'react';

// Receives the REAL product document (with _id, stock, populated farmer,
// etc.) directly — not a pre-flattened display-only copy. This card reads
// farmer/location off the real shape itself so nothing needs to strip
// fields before handing the product to Cart/Wishlist/Buy Now handlers.
export default function ProductCard({ product, onAddToCart, onBuyNow, onWishlist, onViewDetails, isWishlisted }) {
  const isSoldOut = product.listingStatus === 'Sold Out' || (product.stock ?? 1) < 1;
  const farmerName = product.farmer?.fullName || product.farmerName || 'Unknown Farmer';
  const location = product.region
    ? [product.region, product.zone].filter(Boolean).join(', ')
    : (product.location || '');

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '250px',
        flexShrink: 0,
        position: 'relative',
        opacity: isSoldOut ? 0.6 : 1,
      }}
    >
      {onWishlist && (
        <button
          onClick={() => onWishlist(product)}
          style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      )}
      <div style={{ backgroundColor: '#e8f5e9', height: '140px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            onError={(e) => {
              // Fallback to emoji if image fails to load
              e.target.style.display = 'none';
            }}
          />
        ) : null}
        <span style={{ display: product.image ? 'none' : 'block' }}>🌾</span>
        {isSoldOut && (
          <span style={{ position: 'absolute', bottom: '0.4rem', left: '0.4rem', backgroundColor: '#c62828', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Sold Out
          </span>
        )}
      </div>
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(product)}
          style={{ background: 'none', border: 'none', padding: 0, color: '#2e7d32', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', alignSelf: 'flex-start' }}
        >
          View Details →
        </button>
      )}
      <h4 style={{ margin: '0.5rem 0 0 0', color: '#1b5e20' }}>
        {onViewDetails ? (
          <button
            onClick={() => onViewDetails(product)}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#1b5e20', cursor: 'pointer', textAlign: 'left' }}
          >
            {product.name}
          </button>
        ) : (
          product.name
        )}
        {product.variety ? <span style={{ fontWeight: 'normal', color: '#777', fontSize: '0.8rem' }}> ({product.variety})</span> : null}
      </h4>
      {product.grade && (
        <span style={{ alignSelf: 'flex-start', backgroundColor: '#fff8e1', color: '#8a6d00', fontSize: '0.72rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
          {product.grade}
        </span>
      )}
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
        Price: <strong>{product.price} ETB / {product.unit || 'Quintal'}</strong>
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>Farmer: {farmerName}</p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>Location: {location}</p>

      {/* Three independent actions, always visible — no hover requirement,
          no responsive hiding. Add to Cart stays on the page; Buy Now
          reuses the same addItem() call then immediately routes to the
          existing checkout flow; Wishlist (heart, above) is fully
          independent of both. */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
        <button
          onClick={() => onAddToCart(product)}
          disabled={isSoldOut}
          style={{
            flex: 1,
            backgroundColor: isSoldOut ? '#bbb' : '#2e7d32',
            color: 'white',
            border: 'none',
            padding: '0.6rem 0.4rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '0.82rem',
            cursor: isSoldOut ? 'not-allowed' : 'pointer',
          }}
        >
          {isSoldOut ? 'Sold Out' : 'Add to Cart'}
        </button>
        <button
          onClick={() => onBuyNow(product)}
          disabled={isSoldOut}
          style={{
            flex: 1,
            backgroundColor: isSoldOut ? '#ddd' : 'white',
            color: isSoldOut ? '#999' : '#2e7d32',
            border: `2px solid ${isSoldOut ? '#ccc' : '#2e7d32'}`,
            padding: '0.6rem 0.4rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '0.82rem',
            cursor: isSoldOut ? 'not-allowed' : 'pointer',
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
