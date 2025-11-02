import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'your-super-secret-jwt-key-change-this';

// Log JWT secret configuration (not the secret itself)
if (process.env.NODE_ENV === 'production') {
  console.log('[JWT UTILS] JWT secret configured:', {
    hasJWT_SECRET: !!process.env.JWT_SECRET,
    hasSESSION_SECRET: !!process.env.SESSION_SECRET,
    secretLength: JWT_SECRET ? JWT_SECRET.length : 0,
    usingFallback: !process.env.JWT_SECRET && !process.env.SESSION_SECRET,
  });
}

// Generate JWT token for admin
export const generateAdminToken = (admin) => {
  console.log('[JWT UTILS] Generating token for admin:', {
    adminId: admin._id?.toString(),
    email: admin.email,
  });
  
  const payload = {
    id: admin._id?.toString(),
    email: admin.email,
    type: 'admin',
  };
  
  try {
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: '24h', // Token expires in 24 hours
      }
    );
    
    console.log('[JWT UTILS] Token generated successfully:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      payload: payload,
    });
    
    return token;
  } catch (error) {
    console.error('[JWT UTILS] Error generating token:', error);
    throw error;
  }
};

// Verify JWT token
export const verifyToken = (token) => {
  console.log('[JWT UTILS] Verifying token:', {
    tokenLength: token?.length || 0,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'undefined',
    hasToken: !!token,
  });
  
  if (!token) {
    console.error('[JWT UTILS] No token provided for verification');
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('[JWT UTILS] Token verified successfully:', {
      decodedId: decoded.id,
      decodedEmail: decoded.email,
      decodedType: decoded.type,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
    });
    
    return decoded;
  } catch (error) {
    console.error('[JWT UTILS] Token verification failed:', {
      errorName: error.name,
      errorMessage: error.message,
      tokenPrefix: token.substring(0, 20) + '...',
    });
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Invalid or expired token');
  }
};

export default { generateAdminToken, verifyToken };

