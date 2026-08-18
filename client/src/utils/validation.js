// utils/validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  // Ethiopian phone number formats: 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx, +2517xxxxxxxx
  const phoneRegex = /^(09|07|\+2519|\+2517)\d{8}$/;
  return phoneRegex.test(phone);
};

// Stricter rule used specifically for Extension Worker creation (admin
// form): exactly 10 digits, starting with 07 or 09 — no +251 prefix, no
// spaces. Deliberately separate from validatePhoneNumber above, which is
// intentionally more permissive for Farmer/Buyer self-registration and
// must not be changed by this rule.
export const EXTENSION_WORKER_PHONE_REGEX = /^(07|09)\d{8}$/;
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
    return 'Full name must be at least 2 characters';
  }
  if (name.trim().length > 100) {
    return 'Full name must be less than 100 characters';
  }
  return null;
};