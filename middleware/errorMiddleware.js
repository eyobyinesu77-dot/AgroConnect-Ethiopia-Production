const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Every controller in this app catches its own errors and responds
  // directly, so this handler mainly catches truly unexpected errors
  // (e.g. a bug in middleware, or — since this project uses Express 5,
  // which auto-forwards rejected promises from async route handlers —
  // any async error a controller's own try/catch didn't anticipate).
  // Without logging here, those errors would be completely invisible in
  // the server's console, making them impossible to debug in production.
  console.error(`❌ [${req.method} ${req.originalUrl}]`, err.stack || err.message);

  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { errorHandler };
