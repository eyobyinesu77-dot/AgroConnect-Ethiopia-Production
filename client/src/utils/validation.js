// utils/validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Ethiopian phone numbers for Farmer/Buyer self-registration: exactly 10
// digits, starting with 07 or 09 — no +251 prefix, no spaces. Matches the
// backend's authoritative check (server/utils/phoneValidation.js); this one
// is only a convenience for instant feedback, never the source of truth.
export const SELF_REGISTER_PHONE_REGEX = /^(07|09)\d{8}$/;
export const validatePhoneNumber = (phone) => SELF_REGISTER_PHONE_REGEX.test(phone);

// Same rule, used for Extension Worker creation (admin form). Kept as a
// separate exported name since that form's own error copy refers to it,
// even though the pattern itself is identical to SELF_REGISTER_PHONE_REGEX.
export const EXTENSION_WORKER_PHONE_REGEX = SELF_REGISTER_PHONE_REGEX;
export const validateExtensionWorkerPhone = (phone) => EXTENSION_WORKER_PHONE_REGEX.test((phone || '').trim());

export const validateFayidaId = (fayidaId) => {
  // Fayida ID must be exactly 13 digits
  return /^\d{13}$/.test(fayidaId);
};

export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) return 'weak';
  
  let score = 0;
  
  // Length
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  
  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*]/.test(password)) score += 1;
  
  if (score >= 5) return 'strong';
  if (score >= 3) return 'medium';
  return 'weak';
};

export const validateFullName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'validation_full_name_min'; // translation key — render with t()
  }
  if (name.trim().length > 100) {
    return 'validation_full_name_max'; // translation key — render with t()
  }
  return null;
};