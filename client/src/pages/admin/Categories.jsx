import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { categoryService } from '../../services/categoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
export default function AdminCategories() {
  const { t } = useLanguage();
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
      toast.error(t(apiErrorKey(error, 'admin_cat_load_error', 'admin_cat_load_error')));
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
      toast.error(t('admin_cat_name_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      await categoryService.createCategory({ name: name.trim(), description: description.trim() || undefined });
      toast.success(t('admin_cat_added'));
      setName('');
      setDescription('');
      loadCategories();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_cat_add_error', 'admin_cat_add_error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin_cat_confirm_delete'))) return;
    setDeletingId(id);
    try {
      await categoryService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      toast.success(t('admin_cat_deleted'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_cat_delete_error', 'admin_cat_delete_error')));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_cat_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_cat_subtitle')}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('admin_cat_name_ph')}
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('admin_cat_desc_ph')}
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {t('admin_cat_add')}
        </button>
      </form>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('admin_cat_loading')} />
      ) : categories.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_cat_empty')}</p>
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
                {t('common_delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
