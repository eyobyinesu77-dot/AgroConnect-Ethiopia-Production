// Farmer identity on dashboard: fullName + fayidaId data-flow checks.
// Run: node --test test/fayidaDashboard.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const maskFayidaId = (id) => {
  if (!id || typeof id !== 'string') return '';
  const digits = id.trim();
  if (digits.length <= 4) return '•'.repeat(digits.length);
  return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};

test('maskFayidaId hides all but last 4 digits', () => {
  assert.equal(maskFayidaId('1234567890123'), '•••••••••0123');
  assert.equal(maskFayidaId('12'), '••');
  assert.equal(maskFayidaId(''), '');
});

test('User schema defines fullName and fayidaId', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'User.js'), 'utf8');
  assert.match(src, /fullName/);
  assert.match(src, /fayidaId/);
});

test('login response includes fullName and fayidaId', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'authController.js'), 'utf8');
  assert.match(src, /fullName:\s*user\.fullName/);
  assert.match(src, /fayidaId:\s*user\.fayidaId/);
});

test('getProfile returns req.user (own record via protect)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'userController.js'), 'utf8');
  assert.match(src, /res\.json\(req\.user\)/);
});

test('Login.jsx maps fullName and fayidaId into auth user object', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'auth', 'Login.jsx'),
    'utf8'
  );
  assert.match(src, /fullName:\s*data\.fullName/);
  assert.match(src, /fayidaId:\s*data\.fayidaId/);
});

test('Farmer Dashboard loads profile and renders fullName and fayidaId', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'farmer', 'Dashboard.jsx'),
    'utf8'
  );
  assert.match(src, /userService\.getProfile/);
  assert.match(src, /fullName/);
  assert.match(src, /fayidaId/);
  assert.match(src, /showFayida|setShowFayida/);
  assert.match(src, /maskFayidaId/);
  assert.doesNotMatch(src, /John Doe|1234567890123|placeholder name/i);
});

test('protect middleware does not strip fullName or fayidaId', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'middleware', 'authMiddleware.js'), 'utf8');
  assert.match(src, /\.select\('-password'\)/);
  assert.doesNotMatch(src, /select\([^)]*fullName/);
  assert.doesNotMatch(src, /select\([^)]*fayidaId/);
});
