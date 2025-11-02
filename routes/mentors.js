import express from 'express';
import Mentor from '../models/Mentor.js';
import { isAdminAuthenticated } from '../middleware/auth.js';
import { freelancerUpload } from '../middleware/upload.js'; // Reuse freelancer upload folder for mentors
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all mentors (public for frontend, protected for admin)
router.get('/', async (req, res) => {
  try {
    const { department } = req.query; // Optional filter by department
    
    const query = department ? { department } : {};
    const mentors = await Mentor.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: mentors,
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mentors',
    });
  }
});

// Get a single mentor by ID
router.get('/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }
    
    res.json({
      success: true,
      data: mentor,
    });
  } catch (error) {
    console.error('Error fetching mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mentor',
    });
  }
});

// Create a new mentor (protected - admin only)
router.post('/', isAdminAuthenticated, freelancerUpload.single('image'), async (req, res) => {
  try {
    const { name, department, linkedin } = req.body;
    
    // Validate required fields
    if (!name || !department || !linkedin) {
      // If image was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    
    // Validate department
    const validDepartments = ['Web Development', 'UI UX Designing', 'Graphic Designing', 'Amazon', 'Digital Marketing', 'Bookkeeping'];
    if (!validDepartments.includes(department)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `Department must be one of: ${validDepartments.join(', ')}`,
      });
    }
    
    // Build image path if file was uploaded
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/freelancers/${req.file.filename}`; // Using freelancers folder for mentors too
    }
    
    const mentor = new Mentor({
      name,
      department,
      linkedin,
      image: imagePath,
    });
    
    await mentor.save();
    
    res.status(201).json({
      success: true,
      data: mentor,
      message: 'Mentor created successfully',
    });
  } catch (error) {
    // If image was uploaded but save failed, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(console.error);
    }
    console.error('Error creating mentor:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating mentor',
    });
  }
});

// Update a mentor (protected - admin only)
router.put('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { name, department, linkedin } = req.body;
    
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }
    
    // Update fields if provided
    if (name) mentor.name = name;
    if (department && ['Web Development', 'UI UX Designing', 'Graphic Designing', 'Amazon', 'Digital Marketing', 'Bookkeeping'].includes(department)) {
      mentor.department = department;
    }
    if (linkedin) mentor.linkedin = linkedin;
    
    await mentor.save();
    
    res.json({
      success: true,
      data: mentor,
      message: 'Mentor updated successfully',
    });
  } catch (error) {
    console.error('Error updating mentor:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating mentor',
    });
  }
});

// Delete a mentor (protected - admin only)
router.delete('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }
    
    // Delete associated image file if it exists
    if (mentor.image) {
      const imagePath = path.join(__dirname, '..', 'public', mentor.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Mentor.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Mentor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting mentor',
    });
  }
});

export default router;


