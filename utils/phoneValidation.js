// Centralized phone-number validation for the whole backend. Previously
// this regex was declared locally inside authController.js — moved here so
// it has one source of truth, and so a second, stricter rule (for
// Extension Worker creation) can sit alongside it without duplicating the
// general one.

// Ethiopian phone formats accepted for Farmer/Buyer self-registration:
// 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx, +2517xxxxxxxx
const ETHIOPIAN_PHONE_REGEX = /^(09|07|\+2519|\+2517)\d{8}$/;

// Stricter rule for Extension Worker creation (admin-only flow): exactly
// 10 digits, starting with 07 or 09 — no +251 prefix, no spaces, no extra
// or missing digits. Deliberately separate from ETHIOPIAN_PHONE_REGEX above
// rather than reusing it, since that one is intentionally more permissive
// (accepts +251-prefixed numbers) and loosening or tightening it would
// change behavior for the unrelated Farmer/Buyer registration flow.
const EXTENSION_WORKER_PHONE_REGEX = /^(07|09)\d{8}$/;

// Trims surrounding whitespace only — never strips internal spaces/dashes,
// since a number like "0712 345 678" must still fail validation rather
// than silently being "fixed" into a valid one.
const normalizePhone = (phone) => (typeof phone === 'string' ? phone.trim() : phone);

module.exports = { ETHIOPIAN_PHONE_REGEX, EXTENSION_WORKER_PHONE_REGEX, normalizePhone };
