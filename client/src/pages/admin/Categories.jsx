import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { categoryService } from '../../services/categoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await categoryService.createCategory({ name: name.trim(), description: description.trim() || undefined });
      toast.success('Category added.');
      setName('');
      setDescription('');
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setDeletingId(id);
    try {
      await categoryService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      toast.success('Category deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>🗂️ Categories</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Manage the product categories used across the marketplace.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name (e.g. Cereals)"
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add
        </button>
      </form>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading categories..." />
      ) : categories.length === 0 ? (
        <p style={{ color: '#666' }}>No categories yet — add one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{cat.name}</p>
                {cat.description && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#777' }}>{cat.description}</p>}
              </div>
              <button
                onClick={() => handleDelete(cat._id)}
                disabled={deletingId === cat._id}
                style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
