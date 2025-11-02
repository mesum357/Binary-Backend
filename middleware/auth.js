// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Authentication required' 
  });
};

// Middleware to check if admin is authenticated
export const isAdminAuthenticated = (req, res, next) => {
  // Debug logging
  console.log('[AUTH MIDDLEWARE] isAdminAuthenticated check:', {
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    userModel: req.user?.constructor?.modelName,
    sessionID: req.sessionID,
    cookie: req.headers.cookie,
    origin: req.headers.origin,
    path: req.path,
  });
  
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Admin') {
    return next();
  }
  
  console.warn('[AUTH MIDDLEWARE] Admin authentication failed:', {
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    userModel: req.user?.constructor?.modelName,
  });
  
  return res.status(401).json({ 
    success: false, 
    message: 'Admin authentication required' 
  });
};

// Alias for compatibility
export const protect = isAuthenticated;

export default { isAuthenticated, protect, isAdminAuthenticated };

