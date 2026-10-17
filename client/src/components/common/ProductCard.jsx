import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dataLabel, geoJoin, geoLabel } from '../../utils/i18nKeys';
import { regionsData } from '../../utils/constants';

// Receives the REAL product document (with _id, stock, populated farmer,
// etc.) directly — not a pre-flattened display-only copy.
export default function ProductCard({ product, onAddToCart, onBuyNow, onWishlist, onViewDetails, isWishlisted }) {
  const { t, formatNumber } = useLanguage();
  const isSoldOut = product.listingStatus === 'Sold Out' || Number(product.stock) < 1;
  const farmerName = product.farmer?.fullName || product.farmerName || t('common_unknown_farmer');
  // Region/zone may be stored as cascade keys (e.g. "amhara") or display names.
  const regionDisplay = (() => {
    const r = product.region;
    if (!r) return '';
    if (regionsData[r]?.name) return regionsData[r].name;
    return r;
  })();
  const zoneDisplay = (() => {
    const r = product.region;
    const z = product.zone;
    if (!z) return '';
    if (r && regionsData[r]?.zones?.[z]?.name) return regionsData[r].zones[z].name;
    // Search all regions for zone key
    for (const reg of Object.values(regionsData)) {
      if (reg.zones?.[z]?.name) return reg.zones[z].name;
    }
    return z;
  })();
  const location = regionDisplay
    ? geoJoin(t, [regionDisplay, zoneDisplay].filter(Boolean), ', ')
    : (product.location || '');
  const unitLabel = dataLabel(t, 'unit', product.unit || 'Quintal');
  const stockValue = Number(product.stock);

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
        opacity: isSoldOut ? 0.75 : 1,
      }}
    >
      {onWishlist && (
        <button
          type="button"
          onClick={() => onWishlist(product)}
          style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1, zIndex: 2 }}
          title={isWishlisted ? t('pc_remove_wishlist') : t('pc_add_wishlist')}
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
              e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('[data-fallback]');
              if (fallback) fallback.style.display = 'block';
            }}
          />
        ) : null}
        <span data-fallback style={{ display: product.image ? 'none' : 'block' }}>🌾</span>
        {isSoldOut && (
          <span style={{ position: 'absolute', bottom: '0.4rem', left: '0.4rem', backgroundColor: '#c62828', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            {t('pc_sold_out')}
          </span>
        )}
      </div>
      {onViewDetails && (
        <button
          type="button"
          onClick={() => onViewDetails(product)}
          style={{ background: 'none', border: 'none', padding: 0, color: '#2e7d32', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', alignSelf: 'flex-start' }}
        >
          {t('pc_view_details')}
        </button>
      )}
      <h4 style={{ margin: '0.5rem 0 0 0', color: '#1b5e20' }}>
        {onViewDetails ? (
          <button
            type="button"
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
          {dataLabel(t, 'grade', product.grade)}
        </span>
      )}
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
        <strong>{formatNumber(product.price)} {t('unit_etb')} / {unitLabel}</strong>
      </p>
      {!isSoldOut && Number.isFinite(stockValue) && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
          {t('pd_stock_available')
            .replace('{stock}', formatNumber(stockValue))
            .replace('{unit}', unitLabel)}
        </p>
      )}
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>{t('pc_farmer_label').split(':')[0]}: {farmerName}</p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>{t('pc_location_label').split(':')[0]}: {location}</p>

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
        {isSoldOut ? (
          <button
            type="button"
            disabled
            style={{
              flex: 1,
              backgroundColor: '#bbb',
              color: 'white',
              border: 'none',
              padding: '0.6rem 0.4rem',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              cursor: 'not-allowed',
            }}
          >
            {t('pc_sold_out')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(product)}
              style={{
                flex: 1,
                backgroundColor: '#2e7d32',
                color: 'white',
                border: 'none',
                padding: '0.6rem 0.4rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {t('pc_add_to_cart')}
            </button>
            <button
              type="button"
              onClick={() => onBuyNow && onBuyNow(product)}
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#2e7d32',
                border: '2px solid #2e7d32',
                padding: '0.6rem 0.4rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {t('pc_buy_now')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
