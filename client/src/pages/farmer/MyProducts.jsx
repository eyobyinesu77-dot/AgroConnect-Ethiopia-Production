import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { productService } from "../../services/productService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useLanguage } from "../../context/LanguageContext";

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function MyProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', stock: '', expiryDate: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await productService.getMyProducts();
        if (isMounted) setProducts(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load your products.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('myproducts_confirm_delete'))) return;

    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((item) => item._id !== id));
      toast.success('Listing deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.listingStatus === 'Sold Out' ? 'Active' : 'Sold Out';
    setTogglingId(item._id);
    try {
      const updated = await productService.updateProduct(item._id, { listingStatus: nextStatus });
      setProducts((prev) => prev.map((p) => (p._id === item._id ? updated : p)));
      toast.success(`Marked as ${nextStatus}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status.');
    } finally {
      setTogglingId(null);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      price: item.price,
      stock: item.stock,
      expiryDate: toDateInputValue(item.expiryDate),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!editForm.price || Number(editForm.price) <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }
    if (editForm.stock === '' || Number(editForm.stock) < 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await productService.updateProduct(id, {
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        expiryDate: editForm.expiryDate || '',
      });
      setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      toast.success('Product updated.');
      setEditingId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('myproducts_loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('myproducts_title')}</h1>
            <p className="text-sm text-gray-500">{t('myproducts_subtitle')}</p>
          </div>
          <Link
            to="/farmer/sell-crop"
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition inline-block text-center"
          >
            {t('myproducts_add_new')}
          </Link>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">{t('myproducts_empty')}</p>
              <Link to="/farmer/sell-crop" className="text-green-700 font-semibold hover:underline">
                {t('myproducts_empty_link')}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm font-semibold border-b border-gray-200">
                    <th className="p-4">{t('myproducts_col_image')}</th>
                    <th className="p-4">{t('myproducts_col_crop_name')}</th>
                    <th className="p-4">{t('myproducts_col_variety')}</th>
                    <th className="p-4">{t('myproducts_col_grade')}</th>
                    <th className="p-4">{t('myproducts_col_category')}</th>
                    <th className="p-4">{t('myproducts_col_price')}</th>
                    <th className="p-4">{t('myproducts_col_qty_unit')}</th>
                    <th className="p-4">{t('myproducts_col_expiry')}</th>
                    <th className="p-4">{t('myproducts_col_status')}</th>
                    <th className="p-4">{t('myproducts_col_location')}</th>
                    <th className="p-4 text-center">{t('myproducts_col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {products.map((item) => {
                    const editing = editingId === item._id;
                    const expired = isExpired(item.expiryDate);

                    return (
                      <tr key={item._id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-lg">🌾</span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-gray-900">{item.name}</td>
                        <td className="p-4 text-gray-600">{item.variety || '—'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700">
                            {item.grade || 'Grade A'}
                          </span>
                        </td>
                        <td className="p-4">{item.category}</td>
                        <td className="p-4 font-bold text-green-700">
                          {editing ? (
                            <input
                              type="number"
                              min="1"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                              className="w-24 border border-gray-300 rounded px-2 py-1 font-normal text-gray-900"
                            />
                          ) : (
                            `${Number(item.price).toLocaleString()} ETB`
                          )}
                        </td>
                        <td className="p-4">
                          {editing ? (
                            <input
                              type="number"
                              min="0"
                              value={editForm.stock}
                              onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                              className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            `${item.stock} ${item.unit || ''}`
                          )}
                        </td>
                        <td className="p-4">
                          {editing ? (
                            <input
                              type="date"
                              value={editForm.expiryDate}
                              onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          ) : item.expiryDate ? (
                            <span className={expired ? 'text-red-600 font-semibold' : ''}>
                              {new Date(item.expiryDate).toLocaleDateString()}
                              {expired && ` ${t('myproducts_expired')}`}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.listingStatus === 'Sold Out' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            {item.listingStatus}
                          </span>
                        </td>
                        <td className="p-4">{[item.region, item.zone, item.woreda].filter(Boolean).join(' / ')}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {editing ? (
                            <>
                              <button
                                onClick={() => saveEdit(item._id)}
                                disabled={isSaving}
                                className="px-3 py-1 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition disabled:opacity-50 mr-2"
                              >
                                {isSaving ? t('myproducts_saving') : t('myproducts_save')}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md font-medium hover:bg-gray-200 transition"
                              >
                                {t('myproducts_cancel')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md font-medium hover:bg-blue-100 transition mr-2"
                              >
                                {t('myproducts_edit')}
                              </button>
                              <button
                                onClick={() => handleToggleStatus(item)}
                                disabled={togglingId === item._id}
                                className="px-3 py-1 bg-amber-50 text-amber-700 rounded-md font-medium hover:bg-amber-100 transition disabled:opacity-50 mr-2"
                              >
                                {togglingId === item._id ? '...' : item.listingStatus === 'Sold Out' ? t('myproducts_reactivate') : t('myproducts_mark_sold_out')}
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                disabled={deletingId === item._id}
                                className="px-3 py-1 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition disabled:opacity-50"
                              >
                                {deletingId === item._id ? t('myproducts_deleting') : t('myproducts_delete')}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
