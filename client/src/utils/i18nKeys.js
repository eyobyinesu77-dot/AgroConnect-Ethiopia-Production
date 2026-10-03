// Maps raw backend enum values (stored in English, e.g. 'In Transit',
// 'Technical Issue') to translation keys. The stored value is never changed —
// only how it is displayed.
import { regionsData } from './constants';

const slug = (v) => String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const unitKey = (unit) => `unit_${slug(unit)}`;
export const logisticsStatusKey = (status) => `lg_status_${slug(status)}`;
export const supportCategoryKey = (category) => `support_category_${slug(category)}`;
export const supportLanguageKey = (language) => `support_language_${slug(language)}`;

// Translate if a key exists, otherwise show the raw value unchanged.
export const tOr = (t, key, raw) => {
  const out = t(key);
  return out === key ? raw : out;
};

// Backend error messages are English-only strings. They are NEVER changed on
// the server; this table only decides which translation key to DISPLAY for a
// known message. Unknown messages fall back to a translated generic key, so
// raw English from the API is never shown to the user.
const API_MESSAGE_KEYS = {
  'Incorrect email or password.': 'api_incorrect_credentials',
  'This email is already registered.': 'api_email_registered',
  'This phone number is already registered.': 'api_phone_registered',
  'Phone number must start with 07 or 09 and contain exactly 10 digits (e.g. 0912345678).': 'val_phone_format',
  'Email and password are required.': 'api_email_password_required',
  'This password reset link is invalid or has expired.': 'api_reset_link_invalid',
  'This verification link is invalid or has expired.': 'verify_invalid_body',
  'New password must be at least 6 characters.': 'change_err_min6',
  'New password must be at least 8 characters.': 'reset_err_min8',
  'The reset email could not be sent right now. Please try again later.': 'api_reset_email_failed',
  'The verification email could not be sent right now. Please try again later.': 'api_verify_email_failed',
  'Only farmers and buyers can self-register. Admin and Extension Worker accounts are created by an administrator.': 'api_self_register_only',
  'User not found.': 'api_user_not_found',
  'A delivery address is required.': 'api_delivery_address_required',
  'Quantity must be a whole number greater than zero.': 'api_quantity_whole',
  'Your cart is empty.': 'api_cart_empty',
  'Product not found.': 'api_product_not_found',
  'Order not found.': 'api_order_not_found',
  'Payment not found.': 'api_payment_not_found',
  'This order has already been paid.': 'api_order_already_paid',
  'This order was cancelled and can no longer be paid.': 'api_order_cancelled',
  'Telebirr transaction ID is required.': 'api_telebirr_txn_required',
  'This Telebirr transaction ID has already been used for a different payment. Please double-check your receipt.': 'api_telebirr_txn_used',
  'Transaction ID looks invalid — it should be 6-20 letters/numbers, as shown in your Telebirr SMS receipt.': 'api_telebirr_txn_invalid',
  'No screenshot uploaded.': 'api_no_screenshot',
  'Please verify the Telebirr payment screenshot before confirming this order.': 'api_verify_screenshot_first',
  'You can only update orders containing your own products.': 'api_not_own_orders',
  'You can only update your own products.': 'api_not_own_products',
  'You can only delete your own products.': 'api_not_own_delete',
  'expiryDate cannot be in the past.': 'api_expiry_past',
  'Valid request id and providerId are required.': 'lg_assign_invalid_ids',
  'Request not found.': 'lg_request_not_found',
  'Provider not found.': 'lg_provider_not_found',
  'Provider is marked unavailable.': 'lg_provider_unavailable',
  'Provider capacity is smaller than this load.': 'lg_provider_capacity',
  'Valid batch id and providerId are required.': 'lg_assign_invalid_ids',
  'Batch not found.': 'lg_batch_not_found',
};

// Returns a TRANSLATION KEY for an axios error: a known backend message maps
// to its key, a missing response means the server was unreachable, anything
// else uses the page's own translated fallback key. Render it with t(key) so
// the text follows the language if it changes after the error appeared.
export const apiErrorKey = (error, fallbackKey, networkKey = 'auth_err_network') => {
  if (!error?.response) return networkKey;
  const msg = error.response?.data?.message;
  if (typeof msg === 'string' && msg.startsWith('Not enough stock for')) return 'api_not_enough_stock';
  return API_MESSAGE_KEYS[msg] || fallbackKey;
};

// Display label for a stored (English) data value. The stored value is never
// changed; only what is shown. Unknown/custom values (a farmer's own variety,
// an admin-created category, a typed-in bank) are shown exactly as stored.
//   dataLabel(t, 'crop', 'Teff')  -> t('crop_teff')
export const dataLabel = (t, prefix, raw) =>
  raw === undefined || raw === null || raw === '' ? raw : tOr(t, `${prefix}_${slug(raw)}`, raw);

// Region / zone / woreda labels. The app stores the picker KEY (e.g.
// 'eastShewa') while other screens may hold the display NAME ('East Shewa'),
// so this resolves either to the translated name. Unknown values (typed
// locations, Addis Ababa/Dire Dawa style names) fall back to the raw value.
const GEO_NAME_BY_KEY = (() => {
  const map = {};
  Object.entries(regionsData).forEach(([rk, r]) => {
    map[rk] = r.name;
    Object.entries(r.zones || {}).forEach(([zk, z]) => {
      map[zk] = z.name;
      Object.entries(z.woredas || {}).forEach(([wk, w]) => { map[wk] = w.name; });
    });
  });
  return map;
})();

export const geoLabel = (t, raw) => {
  if (raw === undefined || raw === null || raw === '') return raw;
  const name = GEO_NAME_BY_KEY[raw] || raw;
  return tOr(t, `geo_${slug(name)}`, name);
};
export const geoJoin = (t, parts, sep) => parts.filter(Boolean).map((p) => geoLabel(t, p)).join(sep);
