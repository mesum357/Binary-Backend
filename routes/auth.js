import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Sign Up
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create user
    const user = await User.create({ fullName, email, password });

    // Create welcome notification
    try {
      await Notification.create({
        user: user._id,
        type: 'welcome',
        title: 'Welcome to Binary Hub!',
        message: `Welcome ${fullName}! We're excited to have you join our community. Explore our courses and services to get started.`,
      });
    } catch (notifError) {
      console.error('Error creating welcome notification:', notifError);
      // Don't fail signup if notification creation fails
    }

    // Auto login after signup
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error during signup' });
      }
      return res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Sign In
router.post('/signin', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid credentials' 
      });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error during signin' 
        });
      }
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    });
  })(req, res, next);
});

// Check Auth Status
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
      },
    });
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Not authenticated' 
  });
});

// Logout
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

