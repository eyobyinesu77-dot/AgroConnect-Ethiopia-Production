import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product listing from the marketplace?')) return;
    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Product removed.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove product.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading products..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>📦 Products</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{products.length} products currently listed on the marketplace.</p>

      {products.length === 0 ? (
        <p style={{ color: '#666' }}>No products listed yet.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Image</th>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Variety</th>
                <th style={{ padding: '0.75rem 1rem' }}>Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Farmer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Price</th>
                <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
                <th style={{ padding: '0.75rem 1rem' }}>Expiry</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
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
                      {p.grade || 'Grade A'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{p.category}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{p.farmer?.fullName || 'Unknown'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1b5e20' }}>{p.price?.toLocaleString()} ETB</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{p.stock} {p.unit}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', backgroundColor: p.listingStatus === 'Sold Out' ? '#ffebee' : '#e8f5e9', color: p.listingStatus === 'Sold Out' ? '#c62828' : '#2e7d32' }}>
                      {p.listingStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                      {deletingId === p._id ? 'Removing...' : 'Remove'}
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
