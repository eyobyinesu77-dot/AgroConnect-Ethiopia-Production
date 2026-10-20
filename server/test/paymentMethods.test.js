// Payment-method tests:  npm test   (Node 18+, no extra packages needed)
//
// Runs the REAL controllers/paymentController.js and controllers/orderController.js.
// Replaced by in-memory fakes: MongoDB models, axios (so no request ever
// reaches Chapa) and notifications. So this proves the application logic, NOT
// that your Chapa keys or Telebirr setup work against the live services.
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

// ---------- fakes ----------
const calls = { paymentCreate: [], orderFindById: 0, axiosPost: [], axiosGet: [], orderCreate: [] };
let orderDoc = null;
let paymentDoc = null;
let otherPayment = null;
let chapaPayment = null;
let chapaVerification = { status: 'success', tx_ref: 'agroconnect-order1-123', amount: 500, currency: 'ETB' };

const thenable = (value, extra = {}) => Object.assign(Promise.resolve(value), extra);

const FakeOrder = {
  findById: () => {
    calls.orderFindById++;
    return thenable(orderDoc, { populate: async () => orderDoc });
  },
  create: async (data) => {
    calls.orderCreate.push(data);
    return { _id: 'order1', ...data };
  },
};
const FakePayment = {
  create: async (data) => {
    calls.paymentCreate.push(data);
    return { _id: 'pay1', ...data };
  },
  findById: async () => paymentDoc,
  findOne: async (query) => {
    if (query && query.tx_ref) {
      calls.chapaLookup = query;
      return chapaPayment;
    }
    return otherPayment;
  },
  findOneAndUpdate: async () => null,
};
const FakeProduct = {
  findById: () => thenable({ _id: 'prod1', name: 'Teff', price: 100, farmer: 'f1' }, { select: async () => ({ stock: 5 }) }),
  findOneAndUpdate: async () => ({ stock: 5, listingStatus: 'Active', save: async () => {} }),
  find: () => ({ select: async () => [{ farmer: { toString: () => 'f1' }, name: 'Teff' }] }),
  findByIdAndUpdate: async () => {},
};
const fakeAxios = {
  post: async (url, body, cfg) => {
    calls.axiosPost.push({ url, body, cfg });
    return { data: { data: { checkout_url: 'https://checkout.chapa.co/pay/abc' } } };
  },
  get: async (url, cfg) => {
    calls.axiosGet.push({ url, cfg });
    return { data: { data: { ...chapaVerification } } };
  },
};
const fakeNotify = { notifyUser: () => {} };

const realLoad = Module._load;
Module._load = function (request, parent) {
  const from = (parent && parent.filename) || '';
  if (request === 'axios') return fakeAxios;
  if (from.endsWith('paymentController.js') || from.endsWith('orderController.js')) {
    if (request.endsWith('/models/Payment')) return FakePayment;
    if (request.endsWith('/models/Order')) return FakeOrder;
    if (request.endsWith('/models/Product')) return FakeProduct;
    if (request.endsWith('/utils/notify')) return fakeNotify;
  }
  return realLoad.apply(this, arguments);
};

const { processPayment, uploadTelebirrProof, chapaWebhook } = require('../controllers/paymentController');
const { createOrder } = require('../controllers/orderController');

// ---------- helpers ----------
const buyer = { _id: 'u1', email: 'buyer@example.com', fullName: 'Bob Buyer' };
const call = async (handler, req) => {
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await handler({ user: buyer, params: {}, ...req }, res);
  return res;
};
const freshOrder = (over = {}) => ({
  _id: 'order1',
  buyer: 'u1',
  status: 'Pending',
  paymentStatus: 'Unpaid',
  totalPrice: 500,
  paymentMethod: undefined,
  orderItems: [],
  save: async () => {},
  ...over,
});
const reset = () => {
  calls.paymentCreate.length = 0;
  calls.axiosPost.length = 0;
  calls.axiosGet.length = 0;
  calls.chapaLookup = null;
  calls.orderCreate.length = 0;
  calls.orderFindById = 0;
  orderDoc = freshOrder();
  paymentDoc = null;
  otherPayment = null;
  chapaPayment = null;
  chapaVerification = { status: 'success', tx_ref: 'agroconnect-order1-123', amount: 500, currency: 'ETB' };
  delete process.env.CHAPA_SECRET_KEY;
};

// ---------- tests ----------
test('every Cash / COD spelling is rejected with 400 before touching the database', async () => {
  const attempts = [
    'Cash on Delivery', 'cash on delivery', 'CASH ON DELIVERY', 'Cash', 'cash', 'CASH', 'COD', 'cod',
    'Cash Payment', 'cash payment', 'cash_payment', 'cash_on_delivery', 'cashOnDelivery', ' Cash on Delivery ',
    ['Cash on Delivery'], { method: 'cash' }, 123, true,
  ];
  for (const paymentMethod of attempts) {
    reset();
    const res = await call(processPayment, { body: { orderId: 'order1', paymentMethod } });
    assert.equal(res.statusCode, 400, `should reject ${JSON.stringify(paymentMethod)}`);
    assert.equal(res.body.message, 'paymentMethod must be one of: Chapa, Telebirr');
    assert.equal(calls.orderFindById, 0, 'must reject before reading the order');
    assert.equal(calls.paymentCreate.length, 0, 'no Payment may be created');
  }
});

test('missing paymentMethod is still a 400', async () => {
  reset();
  const res = await call(processPayment, { body: { orderId: 'order1' } });
  assert.equal(res.statusCode, 400);
  assert.equal(calls.paymentCreate.length, 0);
});

test('Chapa without a secret key is rejected and never marked successful', async () => {
  reset();
  const res = await call(processPayment, { body: { orderId: 'order1', paymentMethod: 'Chapa' } });
  assert.equal(res.statusCode, 503);
  assert.match(res.body.message, /CHAPA_SECRET_KEY/);
  assert.equal(calls.axiosPost.length, 0, 'no network call without a key');
  assert.equal(calls.paymentCreate.length, 0, 'no payment record without real initialization');
  assert.equal(orderDoc.paymentMethod, undefined);
  assert.equal(orderDoc.paymentStatus, 'Unpaid');
});

test('Chapa (key configured): initializes a real Chapa transaction and returns checkoutUrl, order stays Unpaid', async () => {
  reset();
  process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';
  const res = await call(processPayment, { body: { orderId: 'order1', paymentMethod: 'Chapa' } });
  assert.equal(res.statusCode, 201);
  assert.equal(calls.axiosPost.length, 1);
  const { url, body, cfg } = calls.axiosPost[0];
  assert.equal(url, 'https://api.chapa.co/v1/transaction/initialize');
  assert.equal(body.amount, 500);
  assert.equal(body.currency, 'ETB');
  assert.match(body.tx_ref, /^agroconnect-order1-\d+$/);
  assert.equal(cfg.headers.Authorization, 'Bearer CHASECK_TEST-placeholder');
  assert.equal(res.body.checkoutUrl, 'https://checkout.chapa.co/pay/abc');
  assert.equal(calls.paymentCreate[0].status, 'Pending');
  assert.equal(orderDoc.paymentStatus, 'Unpaid', 'only the webhook may mark a real Chapa payment Paid');
});

test('Telebirr: unchanged — Payment recorded as Pending, awaiting screenshot verification', async () => {
  reset();
  const res = await call(processPayment, { body: { orderId: 'order1', paymentMethod: 'Telebirr' } });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Payment started — please continue.');
  assert.equal(res.body.checkoutUrl, null);
  assert.equal(calls.axiosPost.length, 0);
  assert.equal(calls.paymentCreate[0].paymentMethod, 'Telebirr');
  assert.equal(calls.paymentCreate[0].status, 'Pending');
  assert.equal(orderDoc.paymentMethod, 'Telebirr');
  assert.equal(orderDoc.paymentStatus, 'Unpaid');
});

test('Telebirr proof upload still works, and is refused for a non-Telebirr payment', async () => {
  reset();
  paymentDoc = { _id: 'pay1', user: 'u1', order: 'order1', paymentMethod: 'Telebirr', save: async () => {} };
  const ok = await call(uploadTelebirrProof, {
    params: { paymentId: 'pay1' },
    body: { transactionId: 'ci91a2b3c4' },
    file: { path: 'https://res.cloudinary.test/shot.png' },
  });
  assert.equal(ok.statusCode, 200);
  assert.equal(paymentDoc.transactionId, 'CI91A2B3C4');
  assert.equal(paymentDoc.status, 'Pending');
  assert.equal(paymentDoc.proofOfPayment.url, 'https://res.cloudinary.test/shot.png');

  paymentDoc = { _id: 'pay2', user: 'u1', order: 'order1', paymentMethod: 'Chapa', save: async () => {} };
  const refused = await call(uploadTelebirrProof, {
    params: { paymentId: 'pay2' },
    body: { transactionId: 'CI91A2B3C4' },
    file: { path: 'x' },
  });
  assert.equal(refused.statusCode, 400);
});

test('an older order stored as "Cash on Delivery" can still be paid with Chapa or Telebirr', async () => {
  for (const method of ['Chapa', 'Telebirr']) {
    reset();
    if (method === 'Chapa') {
      process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';
    }
    orderDoc = freshOrder({ paymentMethod: 'Cash on Delivery' });
    const res = await call(processPayment, { body: { orderId: 'order1', paymentMethod: method } });
    assert.equal(res.statusCode, 201);
    assert.equal(orderDoc.paymentMethod, method);
  }
});

test('existing payment guards are unchanged (404 / 403 / cancelled / already paid)', async () => {
  reset();
  orderDoc = null;
  assert.equal((await call(processPayment, { body: { orderId: 'x', paymentMethod: 'Chapa' } })).statusCode, 404);
  reset();
  orderDoc = freshOrder({ buyer: 'someone-else' });
  assert.equal((await call(processPayment, { body: { orderId: 'order1', paymentMethod: 'Chapa' } })).statusCode, 403);
  reset();
  orderDoc = freshOrder({ status: 'Cancelled' });
  assert.equal((await call(processPayment, { body: { orderId: 'order1', paymentMethod: 'Chapa' } })).statusCode, 400);
  reset();
  orderDoc = freshOrder({ paymentStatus: 'Paid' });
  assert.equal((await call(processPayment, { body: { orderId: 'order1', paymentMethod: 'Chapa' } })).statusCode, 400);
});

test('POST /api/orders cannot smuggle a payment method in: createOrder ignores body.paymentMethod', async () => {
  reset();
  const res = await call(createOrder, {
    body: {
      orderItems: [{ product: 'prod1', quantity: 2 }],
      shippingAddress: 'Sodo',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Paid',
    },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(calls.orderCreate.length, 1);
  assert.equal('paymentMethod' in calls.orderCreate[0], false);
  assert.equal('paymentStatus' in calls.orderCreate[0], false);
});


// ---------- Chapa webhook verification tests ----------
test('Chapa webhook: successful verification marks the matching order and payment paid', async () => {
  reset();
  process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';

  chapaPayment = {
    _id: 'payChapa1',
    order: 'order1',
    paymentMethod: 'Chapa',
    tx_ref: 'agroconnect-order1-123',
    amount: 500,
    status: 'Pending',
    save: async () => {},
  };
  orderDoc = freshOrder({ paymentMethod: 'Chapa' });

  const res = await call(chapaWebhook, {
    body: { tx_ref: 'agroconnect-order1-123' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Chapa payment verified successfully.');
  assert.equal(orderDoc.paymentStatus, 'Paid');
  assert.equal(chapaPayment.status, 'Success');
  assert.equal(calls.axiosGet.length, 1);
  assert.match(calls.axiosGet[0].url, /agroconnect-order1-123$/);
  assert.equal(
    calls.axiosGet[0].cfg.headers.Authorization,
    'Bearer CHASECK_TEST-placeholder'
  );
  assert.deepEqual(calls.chapaLookup, {
    tx_ref: 'agroconnect-order1-123',
    paymentMethod: 'Chapa',
  });
});

test('Chapa webhook: mismatched verification details never mark payment paid', async (t) => {
  const cases = [
    {
      name: 'wrong amount',
      verification: {
        status: 'success',
        tx_ref: 'agroconnect-order1-123',
        amount: 499,
        currency: 'ETB',
      },
    },
    {
      name: 'wrong transaction reference',
      verification: {
        status: 'success',
        tx_ref: 'different-reference',
        amount: 500,
        currency: 'ETB',
      },
    },
    {
      name: 'unsuccessful transaction',
      verification: {
        status: 'failed',
        tx_ref: 'agroconnect-order1-123',
        amount: 500,
        currency: 'ETB',
      },
    },
    {
      name: 'wrong currency',
      verification: {
        status: 'success',
        tx_ref: 'agroconnect-order1-123',
        amount: 500,
        currency: 'USD',
      },
    },
  ];

  for (const item of cases) {
    await t.test(item.name, async () => {
      reset();
      process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';
      chapaVerification = item.verification;
      chapaPayment = {
        _id: 'payChapa1',
        order: 'order1',
        paymentMethod: 'Chapa',
        tx_ref: 'agroconnect-order1-123',
        amount: 500,
        status: 'Pending',
        save: async () => {},
      };
      orderDoc = freshOrder({ paymentMethod: 'Chapa' });

      const res = await call(chapaWebhook, {
        body: { tx_ref: 'agroconnect-order1-123' },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(
        res.body.message,
        'Chapa verification did not match the expected transaction.'
      );
      assert.equal(orderDoc.paymentStatus, 'Unpaid');
      assert.equal(chapaPayment.status, 'Pending');
    });
  }
});

test('Chapa webhook: missing secret key or transaction reference is rejected', async () => {
  reset();

  const missingKey = await call(chapaWebhook, {
    body: { tx_ref: 'agroconnect-order1-123' },
  });
  assert.equal(missingKey.statusCode, 400);
  assert.equal(calls.axiosGet.length, 0);

  process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';
  const missingReference = await call(chapaWebhook, { body: {} });
  assert.equal(missingReference.statusCode, 400);
  assert.equal(calls.axiosGet.length, 0);
});

test('Chapa webhook: unknown transaction reference is rejected without verification', async () => {
  reset();
  process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';

  const res = await call(chapaWebhook, {
    body: { tx_ref: 'unknown-reference' },
  });

  assert.equal(res.statusCode, 404);
  assert.equal(
    res.body.message,
    'Chapa transaction reference was not found.'
  );
  assert.equal(calls.axiosGet.length, 0);
});

test('Chapa webhook: cancelled orders are never marked paid', async () => {
  reset();
  process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST-placeholder';

  chapaPayment = {
    _id: 'payChapa1',
    order: 'order1',
    paymentMethod: 'Chapa',
    tx_ref: 'agroconnect-order1-123',
    amount: 500,
    status: 'Pending',
    save: async () => {},
  };
  orderDoc = freshOrder({
    paymentMethod: 'Chapa',
    status: 'Cancelled',
  });

  const res = await call(chapaWebhook, {
    body: { tx_ref: 'agroconnect-order1-123' },
  });

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, 'Cancelled orders cannot be marked paid.');
  assert.equal(orderDoc.paymentStatus, 'Unpaid');
  assert.equal(chapaPayment.status, 'Pending');
});
