import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AddressDropdowns from '../../components/common/AddressDropdown';
import { cropTypes, cropVarieties, cropTypeToCategory, productUnits, productGrades } from '../../utils/constants';
import { productService } from '../../services/productService';
import { uploadService } from '../../services/uploadService';
import { categoryService } from '../../services/categoryService';
import { useLanguage } from '../../context/LanguageContext';

const INITIAL_FORM_STATE = {
  cropType: '',
  category: '',
  variety: '',
  customVariety: '',
  grade: 'Grade A',
  unit: 'Quintal',
  quantity: '',
  price: '',
  expiryDate: '',
  description: '',
  region: '',
  zone: '',
  woreda: '',
  kebele: '',
};

// Blocks keyboard entry of characters that would otherwise let a <input
// type="number"> accept scientific notation or a sign — 'e'/'E' (exponent),
// '+', and '-'. This does not by itself stop negative/zero values (a user
// could still paste "-5" or clear the field down to "0"), so it's paired
// with an explicit numeric check in handleSubmit below.
const blockInvalidNumberKeys = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

const isPositiveNumber = (value) => {
  const num = Number(value);
  return value !== '' && !Number.isNaN(num) && num > 0;
};

const MAX_IMAGE_SIZE_MB = 5;

export default function SellCrop() {
  const { t } = useLanguage();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await categoryService.getCategories();
        if (isMounted) setCategories(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load categories.');
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Variety options depend on which Crop Type is selected — changing the
    // parent must clear the now-possibly-invalid child selection, same rule
    // applied to the Region/Zone/Woreda/Kebele cascade in AddressDropdown.
    // Also auto-select the matching Category (see cropTypeToCategory in
    // constants.js) so a crop type and its category can't end up mismatched
    // — but only when that category actually exists in the admin-managed
    // list fetched from the backend; if it's been renamed or removed,
    // leave the category field for the farmer to pick manually instead of
    // silently clearing or guessing.
    if (name === 'cropType') {
      const suggestedCategory = cropTypeToCategory[value];
      const matchedCategory = categories.find(
        (cat) => cat.name.toLowerCase() === (suggestedCategory || '').toLowerCase()
      );
      setFormData((prev) => ({
        ...prev,
        cropType: value,
        variety: '',
        customVariety: '',
        category: matchedCategory ? matchedCategory.name : prev.category,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Match by general "image/*" rather than an exact MIME whitelist —
    // some mobile camera apps report slightly different image MIME types,
    // and rejecting those was blocking valid photos unnecessarily.
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    handleRemoveImage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setJustSubmitted(false);

    if (!formData.cropType) {
      toast.error('Please select a crop type.');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a product category.');
      return;
    }
    if (!isPositiveNumber(formData.quantity)) {
      toast.error('Quantity must be a positive number greater than 0.');
      return;
    }
    if (!isPositiveNumber(formData.price)) {
      toast.error('Price must be a positive number greater than 0.');
      return;
    }
    if (!formData.region || !formData.zone || !formData.woreda) {
      toast.error('Please select your Region, Zone, and Woreda.');
      return;
    }
    if (formData.variety === 'Other' && !formData.customVariety.trim()) {
      toast.error('Please type the local variety name, or choose one from the list.');
      return;
    }

    const finalVariety = formData.variety === 'Other' ? formData.customVariety.trim() : formData.variety;

    setIsSubmitting(true);
    try {
      let imageUrl;
      if (imageFile) {
        const uploadResult = await uploadService.uploadImage(imageFile);
        imageUrl = uploadResult.url;
      }

      await productService.createProduct({
        name: formData.cropType,
        category: formData.category,
        variety: finalVariety || undefined,
        grade: formData.grade,
        unit: formData.unit,
        price: Number(formData.price),
        stock: Number(formData.quantity),
        expiryDate: formData.expiryDate || undefined,
        description: formData.description || undefined,
        image: imageUrl,
        region: formData.region,
        zone: formData.zone,
        woreda: formData.woreda,
        kebele: formData.kebele || undefined,
      });

      toast.success('Your product has been listed for sale! 🎉');
      resetForm();
      setJustSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to list product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 sm:mb-6">
        {t('sellcrop_title')}
      </h2>

      {justSubmitted && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-green-800 text-sm font-medium">
            {t('sellcrop_success_banner')}
          </p>
          <Link
            to="/farmer/products"
            className="shrink-0 text-center bg-white border border-green-600 text-green-700 font-semibold px-4 py-2 rounded-md hover:bg-green-100 transition-colors text-sm"
          >
            {t('sellcrop_view_my_products')}
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        {/* Crop Type + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm text-gray-700">{t('sellcrop_crop_type_label')}</label>
            <select
              name="cropType"
              value={formData.cropType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t('sellcrop_crop_type_placeholder')}</option>
              {cropTypes.map((crop) => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-700">{t('sellcrop_category_label')}</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={isLoadingCategories}
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {isLoadingCategories ? t('sellcrop_category_loading') : t('sellcrop_category_placeholder')}
              </option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Local Variety (depends on Crop Type) + Quality Grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm text-gray-700">
              {t('sellcrop_variety_label')} <span className="text-gray-400">({t('sellcrop_optional')})</span>
            </label>
            <select
              name="variety"
              value={formData.variety}
              onChange={handleChange}
              disabled={!formData.cropType}
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {formData.cropType ? t('sellcrop_variety_placeholder_ready') : t('sellcrop_variety_placeholder_select_crop_first')}
              </option>
              {(cropVarieties[formData.cropType] || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
              {formData.cropType && <option value="Other">{t('sellcrop_variety_other')}</option>}
            </select>
            {formData.variety === 'Other' && (
              <input
                type="text"
                name="customVariety"
                value={formData.customVariety}
                onChange={handleChange}
                placeholder={t('sellcrop_variety_custom_placeholder')}
                className="mt-2 w-full px-3 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-700">{t('sellcrop_grade_label')}</label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {productGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity + Unit + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm text-gray-700">{t('sellcrop_quantity_label')}</label>
            <input
              type="number"
              name="quantity"
              placeholder="15"
              value={formData.quantity}
              onChange={handleChange}
              onKeyDown={blockInvalidNumberKeys}
              onWheel={(e) => e.currentTarget.blur()}
              required
              min="1"
              step="1"
              inputMode="numeric"
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-700">{t('sellcrop_unit_label')}</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {productUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-700">{t('sellcrop_price_label')}</label>
            <input
              type="number"
              name="price"
              placeholder="6500"
              value={formData.price}
              onChange={handleChange}
              onKeyDown={blockInvalidNumberKeys}
              onWheel={(e) => e.currentTarget.blur()}
              required
              min="1"
              step="1"
              inputMode="numeric"
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block mb-1 text-sm text-gray-700">
            {t('sellcrop_expiry_label')} <span className="text-gray-400">({t('sellcrop_optional')})</span>
          </label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full sm:w-1/2 px-3 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 text-sm text-gray-700">
            {t('sellcrop_description_label')} <span className="text-gray-400">({t('sellcrop_optional')})</span>
          </label>
          <textarea
            name="description"
            placeholder={t('sellcrop_description_placeholder')}
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 font-sans"
          />
        </div>

        {/* Product Image */}
        <div>
          <label className="block mb-1 text-sm text-gray-700">
            {t('sellcrop_image_label')} <span className="text-gray-400">({t('sellcrop_optional')}, max {MAX_IMAGE_SIZE_MB}MB)</span>
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-md border border-gray-200"
              />
            )}
            {/* Two explicit options on mobile: open the camera directly, or
                pick an existing photo/screenshot from the gallery. */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="text-sm border border-green-700 text-green-700 font-semibold py-2 px-3 rounded-md hover:bg-green-50"
              >
                {t('sellcrop_take_photo')}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="text-sm border border-green-700 text-green-700 font-semibold py-2 px-3 rounded-md hover:bg-green-50"
              >
                {t('sellcrop_choose_gallery')}
              </button>
              {imageFile && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 font-medium hover:underline"
                >
                  {t('sellcrop_remove')}
                </button>
              )}
            </div>

            {/* Hidden actual file inputs — the buttons above trigger these. */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Cascading address dropdown */}
        <AddressDropdowns
          value={{ region: formData.region, zone: formData.zone, woreda: formData.woreda, kebele: formData.kebele }}
          onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full sm:w-auto sm:self-start sm:px-10 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-colors"
        >
          {isSubmitting ? t('sellcrop_submitting') : t('sellcrop_list_product')}
        </button>
      </form>
    </div>
  );
}
