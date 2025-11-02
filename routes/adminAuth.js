import express from 'express';
import passport from 'passport';
import Admin from '../models/Admin.js';
import { generateAdminToken } from '../utils/jwt.js';

const router = express.Router();

// Admin Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide full name, email, and password' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    // Create admin
    const admin = await Admin.create({ fullName, email, password });

    // Generate JWT token for auto login after signup
    const token = generateAdminToken(admin);
    
    return res.status(201).json({
      success: true,
      token, // JWT token for frontend to store
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Admin Sign In
router.post('/signin', (req, res, next) => {
  passport.authenticate('admin-local', (err, admin, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }

    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid credentials' 
      });
    }

    // Generate JWT token instead of using session cookies
    console.log('[AUTH BACKEND] Sign-in successful, generating JWT token...');
    const token = generateAdminToken(admin);
    
    console.log('[AUTH BACKEND] Admin logged in (JWT):', {
      adminId: admin._id,
      email: admin.email,
      tokenGenerated: !!token,
      tokenLength: token?.length || 0,
      responseOrigin: req.headers.origin,
    });
    
    // Return JWT token in response
    const responseData = {
      success: true,
      token, // JWT token for frontend to store
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
      },
    };
    
    console.log('[AUTH BACKEND] Sending sign-in response:', {
      hasToken: !!responseData.token,
      hasAdmin: !!responseData.admin,
      adminId: responseData.admin._id,
      statusCode: 200,
    });
    
    res.status(200).json(responseData);
  })(req, res, next);
});

// Check Admin Auth Status (JWT-based)
router.get('/me', async (req, res) => {
  console.log('[AUTH BACKEND] /me endpoint called:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    authorizationHeader: req.headers.authorization ? 'Present' : 'Missing',
    authorizationValue: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'N/A',
    allHeaders: Object.keys(req.headers),
  });
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    console.log('[AUTH BACKEND] /me - Authorization header check:', {
      hasHeader: !!authHeader,
      headerLength: authHeader?.length || 0,
      startsWithBearer: authHeader?.startsWith('Bearer ') || false,
      fullHeader: authHeader ? authHeader.substring(0, 50) + '...' : 'undefined',
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH BACKEND] /me - No valid token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    console.log('[AUTH BACKEND] /me - Extracted token:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
    });
    
    // Verify token
    const { verifyToken } = await import('../utils/jwt.js');
    const decoded = verifyToken(token);
    
    console.log('[AUTH BACKEND] /me - Token decoded:', {
      decodedId: decoded.id,
      decodedEmail: decoded.email,
      decodedType: decoded.type,
    });
    
    if (decoded.type !== 'admin') {
      console.warn('[AUTH BACKEND] /me - Invalid token type:', decoded.type);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token type' 
      });
    }
    
    // Find admin from token
    const admin = await Admin.findById(decoded.id);
    
    console.log('[AUTH BACKEND] /me - Admin lookup:', {
      adminId: decoded.id,
      adminFound: !!admin,
      adminEmail: admin?.email,
    });
    
    if (!admin) {
      console.warn('[AUTH BACKEND] /me - Admin not found:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }
    
    console.log('[AUTH BACKEND] /me - Success:', {
      adminId: admin._id,
      email: admin.email,
    });
    
    return res.status(200).json({
      success: true,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('[AUTH BACKEND] /me error:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    return res.status(401).json({ 
      success: false, 
      message: error.message || 'Invalid or expired token' 
    });
  }
});

// Admin Logout (JWT-based - client removes token)
router.post('/logout', (req, res) => {
  // With JWT, logout is handled on client side by removing token
  // This endpoint is kept for compatibility
  return res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;

