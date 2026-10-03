// Password reset flow test:  npm test   (Node 18+, no extra packages needed)
//
// WHAT THIS RUNS FOR REAL: controllers/authController.js (forgotPassword,
// resetPassword, loginUser), utils/tokenUtils.js, utils/clientUrl.js,
// utils/emailTemplates.js and utils/sendEmail.js.
//
// WHAT IS REPLACED: MongoDB (in-memory fake User model) and the SMTP socket
// (fake Nodemailer transport) — so this proves the application LOGIC, not that
// your MongoDB Atlas cluster or Gmail account works. For those use
// `npm run verify:email` (real SMTP login) and a real click-through on the
// deployed site. bcryptjs / jsonwebtoken are used for real when installed and
// replaced by a scrypt/stub fallback only when they are not.
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const crypto = require('crypto');
const path = require('path');

// ---------- in-memory fakes ----------
const users = [];
const matches = (doc, query) =>
  Object.entries(query).every(([k, v]) => {
    if (v && typeof v === 'object' && '$gt' in v) {
      return doc[k] !== undefined && new Date(doc[k]).getTime() > Number(v.$gt);
    }
    return doc[k] === v;
  });

class FakeUser {
  static findOne(query) {
    const doc = users.find((u) => matches(u, query)) || null;
    const p = Promise.resolve(doc);
    p.select = () => p; // supports .select('+field ...')
    return p;
  }
}
const makeUser = (fields) => {
  const u = { _id: crypto.randomBytes(6).toString('hex'), role: 'farmer', ...fields, save: async () => u };
  users.push(u);
  return u;
};

const mail = { sent: [], mode: 'ok', configured: true };
const fakeSend = async (opts) => {
  if (mail.mode === 'fail') throw Object.assign(new Error('535 Username and Password not accepted'), { code: 'EAUTH' });
  mail.sent.push(opts);
  return { messageId: '<test@local>', accepted: [opts.email], rejected: [] };
};
fakeSend.isConfigured = () => mail.configured;

const smtp = { sendMail: async () => ({ accepted: ['x@y.z'], rejected: [], messageId: '<m>' }), verify: async () => true };
const fakeNodemailer = { createTransport: () => smtp };

const fallbackBcrypt = {
  genSalt: async () => crypto.randomBytes(8).toString('hex'),
  hash: async (pw, salt) => `${salt}$${crypto.scryptSync(pw, salt, 32).toString('hex')}`,
  compare: async (pw, h) => {
    const [salt, hex] = h.split('$');
    return crypto.scryptSync(pw, salt, 32).toString('hex') === hex;
  },
};
const fallbackJwt = { sign: (payload) => `jwt.${payload.id}` };

const realLoad = Module._load;
let bcryptImpl = 'real bcryptjs';
Module._load = function (request, parent, isMain) {
  const from = (parent && parent.filename) || '';
  const fromController = from.endsWith('authController.js');
  if (fromController && request.endsWith('/models/User')) return FakeUser;
  if (fromController && request.endsWith('/utils/sendEmail')) return fakeSend;
  if (request === 'nodemailer') return fakeNodemailer;
  if (request === 'bcryptjs' || request === 'jsonwebtoken') {
    try {
      return realLoad.apply(this, arguments);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
      if (request === 'bcryptjs') bcryptImpl = 'scrypt fallback (bcryptjs not installed)';
      return request === 'bcryptjs' ? fallbackBcrypt : fallbackJwt;
    }
  }
  return realLoad.apply(this, arguments);
};

const { forgotPassword, resetPassword, loginUser } = require('../controllers/authController');
const { hashToken } = require('../utils/tokenUtils');
const { getClientUrl } = require('../utils/clientUrl');
const bcrypt = require('bcryptjs');

// ---------- helpers ----------
const call = async (handler, body) => {
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await handler({ body, params: {}, query: {} }, res);
  return res;
};
const withEnv = async (env, fn) => {
  const keys = ['NODE_ENV', 'CLIENT_URL', 'FRONTEND_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_PORT', 'JWT_SECRET'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  keys.forEach((k) => delete process.env[k]);
  Object.assign(process.env, env);
  try { await fn(); } finally {
    keys.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  }
};
const tokenFromLastEmail = () => {
  const m = mail.sent.at(-1).message.match(/(https?:\/\/\S+?)\/reset-password\?token=([0-9a-f]{64})/);
  assert.ok(m, 'email body must contain a reset link with a 64-hex token');
  return { base: m[1], token: m[2] };
};
const reset = () => { users.length = 0; mail.sent.length = 0; mail.mode = 'ok'; mail.configured = true; };
const PROD = { NODE_ENV: 'production', CLIENT_URL: 'https://agro.example.vercel.app', FRONTEND_URL: 'http://localhost:5173', JWT_SECRET: 'test-secret-for-unit-tests' };

console.log(`(password hashing in this run: ${bcryptImpl})`);

// ---------- tests ----------
test('registered email: generic 200, email sent, token stored HASHED with 1h expiry, prod link', async () => {
  reset();
  await withEnv(PROD, async () => {
    const u = makeUser({ email: 'farmer@example.com', password: 'x' });
    const before = Date.now();
    const res = await call(forgotPassword, { email: '  Farmer@Example.com ' });

    assert.equal(res.statusCode, 200);
    assert.equal(mail.sent.length, 1);
    assert.equal(mail.sent[0].email, 'farmer@example.com');

    const { base, token } = tokenFromLastEmail();
    assert.equal(base, 'https://agro.example.vercel.app');
    assert.ok(!/localhost|127\.0\.0\.1/.test(mail.sent[0].message + mail.sent[0].html));
    assert.notEqual(u.resetPasswordToken, token, 'raw token must not be stored');
    assert.equal(u.resetPasswordToken, hashToken(token), 'SHA-256 of emailed token is stored');
    const ttl = u.resetPasswordExpires.getTime() - before;
    assert.ok(ttl > 59 * 60e3 && ttl <= 61 * 60e3, `expiry should be ~1h, got ${ttl}ms`);
  });
});

test('unknown email: IDENTICAL status + body as a registered email, nothing sent', async () => {
  reset();
  await withEnv(PROD, async () => {
    makeUser({ email: 'real@example.com', password: 'x' });
    const real = await call(forgotPassword, { email: 'real@example.com' });
    const ghost = await call(forgotPassword, { email: 'nobody@example.com' });
    assert.equal(ghost.statusCode, real.statusCode);
    assert.deepEqual(ghost.body, real.body);
    assert.equal(mail.sent.length, 1, 'only the registered account gets an email');
  });
});

test('SMTP failure for a registered email is a 500 — never reported as sent', async () => {
  reset();
  await withEnv(PROD, async () => {
    makeUser({ email: 'real@example.com', password: 'x' });
    mail.mode = 'fail';
    const res = await call(forgotPassword, { email: 'real@example.com' });
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body.message, /has been sent/i);
  });
});

test('production + localhost-only URLs: fails for EVERY email, nothing sent, no token stored', async () => {
  reset();
  await withEnv({ NODE_ENV: 'production', FRONTEND_URL: 'http://localhost:5173' }, async () => {
    const u = makeUser({ email: 'real@example.com', password: 'x' });
    const a = await call(forgotPassword, { email: 'real@example.com' });
    const b = await call(forgotPassword, { email: 'nobody@example.com' });
    assert.equal(a.statusCode, 500);
    assert.equal(b.statusCode, 500);
    assert.equal(mail.sent.length, 0);
    assert.equal(u.resetPasswordToken, undefined);
  });
});

test('SMTP not configured: fails for every email alike', async () => {
  reset();
  mail.configured = false;
  await withEnv(PROD, async () => {
    makeUser({ email: 'real@example.com', password: 'x' });
    assert.equal((await call(forgotPassword, { email: 'real@example.com' })).statusCode, 500);
    assert.equal((await call(forgotPassword, { email: 'nobody@example.com' })).statusCode, 500);
  });
});

test('getClientUrl: list/trailing-slash/no-scheme handling', async () => {
  await withEnv({ NODE_ENV: 'production', CLIENT_URL: 'agro.vercel.app', FRONTEND_URL: 'http://localhost:5173, https://real.vercel.app/' }, () => {
    assert.equal(getClientUrl(), 'https://real.vercel.app');
  });
  await withEnv({ NODE_ENV: 'development' }, () => {
    assert.equal(getClientUrl(), 'http://localhost:5173');
  });
  await withEnv({ NODE_ENV: 'production', CLIENT_URL: 'agro.vercel.app' }, () => {
    assert.throws(() => getClientUrl(), /CLIENT_URL/);
  });
});

test('FULL FLOW: forgot -> bad/short/expired/reused tokens rejected -> reset saved -> login', async () => {
  reset();
  await withEnv(PROD, async () => {
    const OLD = 'OldPassword1';
    const NEW = 'BrandNewPass9';
    const salt = await bcrypt.genSalt(10);
    const u = makeUser({ email: 'farmer@example.com', password: await bcrypt.hash(OLD, salt), mustChangePassword: true });

    // old password logs in before the reset
    assert.equal((await call(loginUser, { email: 'farmer@example.com', password: OLD })).statusCode, 200);

    await call(forgotPassword, { email: 'farmer@example.com' });
    const { token } = tokenFromLastEmail();

    assert.equal((await call(resetPassword, { token, newPassword: 'short' })).statusCode, 400);
    assert.equal((await call(resetPassword, { token: 'f'.repeat(64), newPassword: NEW })).statusCode, 400);
    assert.equal((await call(resetPassword, { token: { $gt: '' }, newPassword: NEW })).statusCode, 400);
    assert.ok(await bcrypt.compare(OLD, u.password), 'failed attempts must not change the password');

    // expired token is rejected
    const realExpiry = u.resetPasswordExpires;
    u.resetPasswordExpires = new Date(Date.now() - 1000);
    assert.equal((await call(resetPassword, { token, newPassword: NEW })).statusCode, 400);
    u.resetPasswordExpires = realExpiry;

    // valid token: password saved
    const ok = await call(resetPassword, { token, newPassword: NEW });
    assert.equal(ok.statusCode, 200);
    assert.ok(await bcrypt.compare(NEW, u.password), 'new password is stored (hashed)');
    assert.notEqual(u.password, NEW);
    assert.equal(u.resetPasswordToken, undefined);
    assert.equal(u.resetPasswordExpires, undefined);
    assert.equal(u.mustChangePassword, false);

    // token is single-use
    assert.equal((await call(resetPassword, { token, newPassword: 'AnotherPass77' })).statusCode, 400);

    // login: new works, old does not
    const good = await call(loginUser, { email: 'farmer@example.com', password: NEW });
    assert.equal(good.statusCode, 200);
    assert.ok(good.body.token);
    assert.equal((await call(loginUser, { email: 'farmer@example.com', password: OLD })).statusCode, 401);
  });
});

test('sendEmail.js (real code, fake SMTP socket): placeholder / unset / rejected recipient / success', async () => {
  const load = () => {
    delete require.cache[require.resolve('../utils/sendEmail')];
    return require('../utils/sendEmail');
  };
  const msg = { email: 'a@b.co', subject: 's', message: 't' };
  const base = { SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_USER: 'me@gmail.com' };

  await withEnv({ ...base, SMTP_PASS: 'your_app_password' }, async () => {
    await assert.rejects(load()(msg), /placeholder/i);
  });
  await withEnv({ SMTP_HOST: 'smtp.gmail.com' }, async () => {
    await assert.rejects(load()(msg), /not configured/i);
  });
  await withEnv({ ...base, SMTP_PASS: 'abcdefghijklmnop' }, async () => {
    smtp.sendMail = async () => ({ accepted: [], rejected: ['a@b.co'] });
    await assert.rejects(load()(msg), /did not accept/i);
    smtp.sendMail = async () => ({ accepted: ['a@b.co'], rejected: [], messageId: '<ok>' });
    assert.equal((await load()(msg)).messageId, '<ok>');
    smtp.sendMail = async () => { throw Object.assign(new Error('Invalid login'), { code: 'EAUTH' }); };
    await assert.rejects(load()(msg), /Invalid login/);
  });
});
