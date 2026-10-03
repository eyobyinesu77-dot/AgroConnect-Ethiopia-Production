const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect Middleware - Production Ready
 * 
 * Verifies JWT token and attaches user object to req.user
 * Rejects requests without valid token
 * 
 * Usage:
 * router.get('/protected-route', protect, controllerFunction)
 * 
 * Token format: "Bearer <jwt_token>"
 * Extracts token from Authorization header
 * 
 * Flow:
 * 1. Check if Authorization header exists and starts with "Bearer"
 * 2. Extract token from header
 * 3. Verify token with JWT_SECRET
 * 4. Fetch user from database (excluding password)
 * 5. Attach user to req.user for next middleware/controller
 * 6. Call next() to proceed
 * 
 * Errors:
 * - No token → 401 "Not authorized, no token"
 * - Invalid token → 401 "Not authorized, token failed"
 * - Expired token → 401 "Not authorized, token failed"
 * - User not found → 401 "Not authorized, token failed"
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Protect a single route
 * router.get('/api/users/profile', protect, userController.getProfile);
 * 
 * // Protect all routes in a router
 * router.use(protect);
 * router.get('/orders', orderController.getMyOrders);
 * router.post('/orders', orderController.createOrder);
 */
const protect = async (req, res, next) => {
  let token;

  try {
    // STEP 1: Extract token from Authorization header
    // Expected format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // STEP 2: Check if token exists
    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized, no token. Please login to access this resource.' 
      });
    }

    // STEP 3: Verify token and decode user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // STEP 4: Fetch user from database
    // Exclude password from response
    req.user = await User.findById(decoded.id).select('-password');

    // STEP 5: Check if user exists
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authorized, user not found.' 
      });
    }

    // STEP 6: Proceed to next middleware/controller
    next();
  } catch (error) {
    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Not authorized, token failed. Invalid token format or signature.' 
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Not authorized, token expired. Please login again.' 
      });
    }

    // Generic error handling
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      message: 'Not authorized, token failed.' 
    });
  }
};

/**
 * optionalAuth Middleware - Production Ready
 * 
 * Attempts to verify JWT token but doesn't reject if invalid
 * Attaches user to req.user if token is valid
 * Proceeds as guest if no token or invalid token
 * 
 * Usage:
 * router.get('/public-route', optionalAuth, controllerFunction)
 * 
 * Perfect for:
 * - Public endpoints that work for both guests and authenticated users
 * - Support forms (guest vs registered user submissions)
 * - Public marketplace browse (higher stats for logged-in users)
 * 
 * Flow:
 * 1. Check if Authorization header exists
 * 2. Try to verify token if present
 * 3. If valid, attach user to req.user
 * 4. If invalid or missing, proceed without user (req.user = undefined)
 * 5. Always call next() - never rejects
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Support form: guest or logged-in submission
 * router.post('/api/support', optionalAuth, supportController.submitTicket);
 * 
 * // In controller:
 * const createTicket = async (req, res) => {
 *   const ticket = {
 *     subject: req.body.subject,
 *     message: req.body.message,
 *     userId: req.user?._id || null,  // optional user ID
 *   };
 *   // ...save ticket...
 * };
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Only attempt authentication if header exists
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Extract token from header
      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database
      req.user = await User.findById(decoded.id).select('-password');

      // User attached to req.user if found
    } catch (error) {
      // Silent failure — invalid/expired token on an optional-auth route
      // Proceed as a guest (req.user remains undefined)
      // This is intentional — no error logged, no response sent
      // Common for:
      // - Expired tokens on public pages
      // - Malformed tokens
      // - User account deleted after token issued
    }
  }

  // Always proceed, whether user was authenticated or not
  next();
};

module.exports = { protect, optionalAuth };