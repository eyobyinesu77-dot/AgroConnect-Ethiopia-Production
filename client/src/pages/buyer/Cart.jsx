import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function BuyerCart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#1b5e20', marginBottom: '1rem' }}>🛒 Shopping Cart</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Your cart is empty.</p>
        <Link
          to="/buyer/marketplace"
          style={{ backgroundColor: '#2e7d32', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' }}
        >
          Browse the Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>🛒 Shopping Cart</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Review the items you've selected before continuing to checkout.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {items.map((item) => (
          <div
            key={item.productId}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 0.3rem 0', color: '#1b5e20' }}>{item.name}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>
                {item.farmerName} · {item.region}
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: '#2e7d32' }}>
                {item.price.toLocaleString()} ETB / unit
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="number"
                min="1"
                max={item.stock || undefined}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                style={{ width: '70px', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
              />
              <span style={{ fontWeight: 'bold', minWidth: '90px', textAlign: 'right' }}>
                {(item.price * item.quantity).toLocaleString()} ETB
              </span>
              <button
                onClick={() => removeItem(item.productId)}
                style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total</p>
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#1b5e20' }}>
            {totalPrice.toLocaleString()} ETB
          </p>
        </div>
        <button
          onClick={() => navigate('/buyer/checkout')}
          style={{ backgroundColor: '#2e7d32', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Proceed to Checkout ➡
        </button>
      </div>
    </div>
  );
}
