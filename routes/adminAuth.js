import express from 'express';
import passport from 'passport';
import Admin from '../models/Admin.js';

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

    // Auto login after signup
    req.login(admin, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error during signup' });
      }
      return res.status(201).json({
        success: true,
        admin: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
        },
      });
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

    req.login(admin, (err) => {
      if (err) {
        console.error('[AUTH BACKEND] Login error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error during signin' 
        });
      }
      
      // Log session info for debugging
      console.log('[AUTH BACKEND] Admin logged in:', {
        adminId: admin._id,
        sessionId: req.sessionID,
        cookie: req.headers.cookie,
        hasSession: !!req.session,
        origin: req.headers.origin,
      });
      
      // Ensure session is saved before sending response
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('[AUTH BACKEND] Session save error:', saveErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Error saving session' 
          });
        }
        
        // Log cookie that will be sent
        const setCookieHeader = res.getHeader('Set-Cookie');
        console.log('[AUTH BACKEND] Set-Cookie header:', setCookieHeader);
        console.log('[AUTH BACKEND] Session config check:', {
          sessionID: req.sessionID,
          hasSession: !!req.session,
          cookieSecure: req.session.cookie?.secure,
          cookieSameSite: req.session.cookie?.sameSite,
          cookieHttpOnly: req.session.cookie?.httpOnly,
        });
        
        // Ensure CORS headers are set
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        
        // Return response after session is saved
        res.status(200).json({
          success: true,
          admin: {
            _id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
          },
        });
      });
    });
  })(req, res, next);
});

// Check Admin Auth Status
router.get('/me', (req, res) => {
  // Debug logging
  console.log('[AUTH BACKEND] /me check:', {
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    userModel: req.user?.constructor?.modelName,
    sessionID: req.sessionID,
    cookie: req.headers.cookie,
    origin: req.headers.origin,
  });
  
  if (req.isAuthenticated() && req.user && req.user.constructor.modelName === 'Admin') {
    return res.status(200).json({
      success: true,
      admin: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
      },
    });
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Not authenticated as admin' 
  });
});

// Admin Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error during logout' 
      });
    }
    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

export default router;

