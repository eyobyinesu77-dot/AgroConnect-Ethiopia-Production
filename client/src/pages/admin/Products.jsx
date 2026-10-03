import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { tOr, unitKey, apiErrorKey, dataLabel } from '../../utils/i18nKeys';

export default function AdminProducts() {
  const { t, formatNumber, formatDate } = useLanguage();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_products_load_error', 'admin_products_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin_products_confirm_delete'))) return;
    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success(t('admin_products_removed'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_products_remove_error', 'admin_products_remove_error')));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('admin_products_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_products_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_products_subtitle').replace('{count}', products.length)}</p>

      {products.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_products_empty')}</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_image')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_name')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_variety')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_grade')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_category')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('role_farmer')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_price')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_stock')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_expiry')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_status')}</th>
                <th style={{ padding: '0.75rem 1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>🌾</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{p.variety || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', backgroundColor: '#fff8e1', color: '#8a6d00' }}>
                      {dataLabel(t, 'grade', p.grade || 'Grade A')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{dataLabel(t, 'category', p.category)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{p.farmer?.fullName || t('admin_orders_unknown')}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1b5e20' }}>{formatNumber(p.price)} {t('unit_etb')}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{formatNumber(p.stock)} {tOr(t, unitKey(p.unit), p.unit)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.expiryDate ? formatDate(p.expiryDate) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', backgroundColor: p.listingStatus === 'Sold Out' ? '#ffebee' : '#e8f5e9', color: p.listingStatus === 'Sold Out' ? '#c62828' : '#2e7d32' }}>
                      {p.listingStatus === 'Sold Out' ? t('listing_status_sold_out') : t('listing_status_active')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                      {deletingId === p._id ? t('admin_products_removing') : t('common_remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
