// Resolves the public frontend URL that goes inside emailed links
// (password reset, email verification).
//
// Reads CLIENT_URL first, then FRONTEND_URL. Either may hold a
// comma-separated list (server.js accepts lists for CORS), so the first
// usable entry is taken.
//
// In production a link that points at localhost is useless to the person
// receiving the email, so instead of quietly sending one this THROWS with a
// message naming the variables to set. Callers turn that into a real error
// response + server log, never a fake "email sent".
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1']);

const parseList = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Returns a URL origin (no path, no trailing slash) or null if the entry is
// not an absolute http(s) URL (e.g. "agro.vercel.app" with no scheme).
const toOrigin = (entry) => {
  try {
    const u = new URL(entry);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.origin;
  } catch {
    return null;
  }
};

const isLocalOrigin = (origin) => LOCAL_HOSTS.has(new URL(origin).hostname);

const getClientUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const origins = [
    ...parseList(process.env.CLIENT_URL),
    ...parseList(process.env.FRONTEND_URL),
  ]
    .map(toOrigin)
    .filter(Boolean);

  if (!isProduction) {
    return origins[0] || 'http://localhost:5173';
  }

  const publicOrigin = origins.find((o) => !isLocalOrigin(o));
  if (!publicOrigin) {
    throw new Error(
      'NODE_ENV=production but CLIENT_URL / FRONTEND_URL is missing, not an absolute ' +
        'http(s) URL, or points at localhost. Set CLIENT_URL (and FRONTEND_URL) to the ' +
        'deployed frontend URL, e.g. https://your-app.vercel.app'
    );
  }
  return publicOrigin;
};

module.exports = { getClientUrl };
