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

// Middleware to check if admin is authenticated (JWT-based)
export const isAdminAuthenticated = async (req, res, next) => {
  console.log('[AUTH MIDDLEWARE] isAdminAuthenticated called:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    hasAuthorization: !!req.headers.authorization,
    authorizationPrefix: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'N/A',
  });
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    console.log('[AUTH MIDDLEWARE] Authorization header check:', {
      hasHeader: !!authHeader,
      headerLength: authHeader?.length || 0,
      startsWithBearer: authHeader?.startsWith('Bearer ') || false,
      fullHeader: authHeader ? authHeader.substring(0, 50) + '...' : 'undefined',
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH MIDDLEWARE] No valid token provided:', {
        path: req.path,
        origin: req.headers.origin,
        method: req.method,
        headersReceived: Object.keys(req.headers),
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Admin authentication required' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    console.log('[AUTH MIDDLEWARE] Token extracted:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
    });
    
    // Verify token
    const { verifyToken } = await import('../utils/jwt.js');
    const decoded = verifyToken(token);
    
    console.log('[AUTH MIDDLEWARE] Token verified:', {
      decodedId: decoded.id,
      decodedEmail: decoded.email,
      decodedType: decoded.type,
    });
    
    if (decoded.type !== 'admin') {
      console.warn('[AUTH MIDDLEWARE] Invalid token type:', {
        expected: 'admin',
        received: decoded.type,
        path: req.path,
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Admin authentication required' 
      });
    }
    
    // Find admin from token
    const Admin = (await import('../models/Admin.js')).default;
    const admin = await Admin.findById(decoded.id);
    
    console.log('[AUTH MIDDLEWARE] Admin lookup:', {
      adminId: decoded.id,
      adminFound: !!admin,
      adminEmail: admin?.email,
    });
    
    if (!admin) {
      console.warn('[AUTH MIDDLEWARE] Admin not found:', {
        adminId: decoded.id,
        path: req.path,
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Admin authentication required' 
      });
    }
    
    // Attach admin to request
    req.admin = admin;
    req.user = admin; // For compatibility
    
    console.log('[AUTH MIDDLEWARE] Admin authenticated successfully:', {
      adminId: admin._id,
      email: admin.email,
      path: req.path,
      method: req.method,
    });
    
    return next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Authentication error:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ 
      success: false, 
      message: 'Admin authentication required' 
    });
  }
};

// Alias for compatibility
export const protect = isAuthenticated;

export default { isAuthenticated, protect, isAdminAuthenticated };

