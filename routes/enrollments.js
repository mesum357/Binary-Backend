import express from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import { protect, isAdminAuthenticated } from '../middleware/auth.js';
import { freelancerUpload } from '../middleware/upload.js'; // Reuse upload middleware
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create enrollment (protected - authenticated user)
router.post('/', protect, freelancerUpload.single('screenshot'), async (req, res) => {
  try {
    const { courseSlug, courseTitle, fullName, email, phone, paymentMethod, message } = req.body;

    // Validate required fields
    if (!courseSlug || !courseTitle || !fullName || !email || !paymentMethod) {
      // If image was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Course, name, email, and payment method are required',
      });
    }

    // Validate payment method
    if (!['easypaisa', 'bank'].includes(paymentMethod)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Payment method must be either "easypaisa" or "bank"',
      });
    }

    // Check if screenshot was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required',
      });
    }

    // Check if user already has an active enrollment for this course
    const existingEnrollment = await Enrollment.findOne({
      'user.userId': req.user._id,
      'course.slug': courseSlug,
      status: 'approved',
      expired: false,
    });

    if (existingEnrollment) {
      // Delete uploaded file if duplicate enrollment found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'You already have an active enrollment for this course. Please wait until it expires before re-enrolling.',
      });
    }

    // Also check for pending enrollments
    const pendingEnrollment = await Enrollment.findOne({
      'user.userId': req.user._id,
      'course.slug': courseSlug,
      status: 'pending',
    });

    if (pendingEnrollment) {
      // Delete uploaded file if pending enrollment found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'You already have a pending enrollment request for this course.',
      });
    }

    // Build screenshot path
    const screenshotPath = `/uploads/freelancers/${req.file.filename}`;

    const enrollment = new Enrollment({
      course: {
        slug: courseSlug,
        title: courseTitle,
      },
      user: {
        userId: req.user._id,
        fullName,
        email,
        phone: phone || undefined,
      },
      payment: {
        method: paymentMethod,
        screenshot: screenshotPath,
      },
      status: 'pending',
      message: message || undefined,
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Enrollment submitted successfully',
    });
  } catch (error) {
    // If image was uploaded but save failed, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(console.error);
    }
    console.error('Error creating enrollment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating enrollment',
    });
  }
});

// Get all enrollments (protected - admin only)
router.get('/', isAdminAuthenticated, async (req, res) => {
  try {
    const { status, course } = req.query; // Optional filters
    
    const query = {};
    if (status) query.status = status;
    if (course) query['course.slug'] = course;
    
    const enrollments = await Enrollment.find(query)
      .populate('user.userId', 'fullName email')
      .sort({ createdAt: -1 });
    
    // Check for expired courses and update them
    const now = new Date();
    for (const enrollment of enrollments) {
      if (enrollment.status === 'approved' && enrollment.expirationDate && !enrollment.expired) {
        if (new Date(enrollment.expirationDate) < now) {
          enrollment.expired = true;
          await enrollment.save();
        }
      }
    }
    
    // Fetch updated enrollments
    const updatedEnrollments = await Enrollment.find(query)
      .populate('user.userId', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: updatedEnrollments,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
    });
  }
});

// Get user's enrollments (My Courses) - protected
router.get('/my-courses', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 'user.userId': req.user._id })
      .sort({ createdAt: -1 });
    
    // Check for expired courses and update them
    const now = new Date();
    for (const enrollment of enrollments) {
      if (enrollment.status === 'approved' && enrollment.expirationDate && !enrollment.expired) {
        if (new Date(enrollment.expirationDate) < now) {
          enrollment.expired = true;
          await enrollment.save();
        }
      }
    }
    
    // Fetch updated enrollments
    const updatedEnrollments = await Enrollment.find({ 'user.userId': req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: updatedEnrollments,
    });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
    });
  }
});

// Get enrollments by user ID (protected - admin only)
// IMPORTANT: This route must come before /:id to avoid route conflicts
router.get('/user/:userId', isAdminAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format (MongoDB ObjectId is 24 hex characters)
    if (!userId || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    // Convert userId to ObjectId for query
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    const enrollments = await Enrollment.find({ 'user.userId': userObjectId })
      .sort({ createdAt: -1 });
    
    // Check for expired courses and update them
    const now = new Date();
    for (const enrollment of enrollments) {
      if (enrollment.status === 'approved' && enrollment.expirationDate && !enrollment.expired) {
        if (new Date(enrollment.expirationDate) < now) {
          enrollment.expired = true;
          await enrollment.save();
        }
      }
    }
    
    // Fetch updated enrollments
    const updatedEnrollments = await Enrollment.find({ 'user.userId': userObjectId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: updatedEnrollments,
    });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
    });
  }
});

// Get a single enrollment by ID (protected - admin only)
router.get('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user.userId', 'fullName email');
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }
    
    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment',
    });
  }
});

// Update enrollment status (protected - admin only)
router.patch('/:id/status', isAdminAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: pending, approved, rejected',
      });
    }
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }
    
    const oldStatus = enrollment.status;
    enrollment.status = status;
    
    // Set purchase date and expiration date when approved
    if (status === 'approved' && oldStatus !== 'approved') {
      const now = new Date();
      enrollment.purchaseDate = now;
      // Set expiration to 30 days from purchase
      const expirationDate = new Date(now);
      expirationDate.setDate(expirationDate.getDate() + 30);
      enrollment.expirationDate = expirationDate;
      enrollment.expired = false;
      enrollment.renewalNotificationSent = false;
    }
    
    await enrollment.save();
    
    // Create notification if status changed to approved or rejected
    if (status !== oldStatus && (status === 'approved' || status === 'rejected')) {
      try {
        await Notification.create({
          user: enrollment.user.userId,
          type: status === 'approved' ? 'admission_accepted' : 'admission_rejected',
          title: status === 'approved' 
            ? 'Admission Request Accepted' 
            : 'Admission Request Rejected',
          message: status === 'approved'
            ? `Congratulations! Your admission request for ${enrollment.course.title} has been accepted.`
            : `Your admission request for ${enrollment.course.title} has been rejected. Please contact us for more information.`,
          enrollmentId: enrollment._id,
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the status update if notification creation fails
      }
    }
    
    res.json({
      success: true,
      data: enrollment,
      message: `Enrollment ${status} successfully`,
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating enrollment status',
    });
  }
});

// Delete enrollment (protected - admin only)
router.delete('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }
    
    // Delete associated screenshot file if it exists
    if (enrollment.payment.screenshot) {
      const screenshotPath = path.join(__dirname, '..', 'public', enrollment.payment.screenshot);
      if (fs.existsSync(screenshotPath)) {
        fs.unlinkSync(screenshotPath);
      }
    }
    
    await Enrollment.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting enrollment',
    });
  }
});

export default router;

