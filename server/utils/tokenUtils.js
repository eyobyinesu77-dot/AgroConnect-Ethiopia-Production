// Shared helpers for generating one-time, expiring tokens (email
// verification, password reset). The raw token is emailed to the user and
// never stored; only its SHA-256 hash is persisted, the same pattern
// already used for JWTs elsewhere in this app but adapted so a leaked
// database does not expose usable tokens.
const crypto = require('crypto');

// Returns { rawToken, hashedToken, expires } — email the rawToken, store
// the hashedToken + expires on the user document.
const createToken = (expiresInMs) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + expiresInMs);
  return { rawToken, hashedToken, expires };
};

const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = { createToken, hashToken };
