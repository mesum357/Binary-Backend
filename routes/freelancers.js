import express from 'express';
import Freelancer from '../models/Freelancer.js';
import { isAdminAuthenticated } from '../middleware/auth.js';
import { freelancerUpload } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all freelancers (public for frontend, protected for admin)
router.get('/', async (req, res) => {
  try {
    const { department } = req.query; // Optional filter by department
    
    const query = department ? { department } : {};
    const freelancers = await Freelancer.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: freelancers,
    });
  } catch (error) {
    console.error('Error fetching freelancers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching freelancers',
    });
  }
});

// Get a single freelancer by ID
router.get('/:id', async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id);
    
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found',
      });
    }
    
    res.json({
      success: true,
      data: freelancer,
    });
  } catch (error) {
    console.error('Error fetching freelancer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching freelancer',
    });
  }
});

// Create a new freelancer (protected - admin only)
router.post('/', isAdminAuthenticated, freelancerUpload.single('image'), async (req, res) => {
  try {
    const { name, title, skills, department, linkedin } = req.body;
    
    // Validate required fields
    if (!name || !title || !skills || !department || !linkedin) {
      // If image was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    
    // Parse skills (should be JSON array string)
    let skillsArray = [];
    try {
      skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
    } catch (e) {
      // If not JSON, treat as array
      skillsArray = Array.isArray(skills) ? skills : [skills];
    }
    
    if (!Array.isArray(skillsArray) || skillsArray.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'At least one skill is required',
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
      imagePath = `/uploads/freelancers/${req.file.filename}`;
    }
    
    const freelancer = new Freelancer({
      name,
      title,
      skills: skillsArray,
      department,
      linkedin,
      image: imagePath,
    });
    
    await freelancer.save();
    
    res.status(201).json({
      success: true,
      data: freelancer,
      message: 'Freelancer created successfully',
    });
  } catch (error) {
    // If image was uploaded but save failed, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(console.error);
    }
    console.error('Error creating freelancer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating freelancer',
    });
  }
});

// Update a freelancer (protected - admin only)
router.put('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const { name, title, skills, department, linkedin } = req.body;
    
    const freelancer = await Freelancer.findById(req.params.id);
    
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found',
      });
    }
    
    // Update fields if provided
    if (name) freelancer.name = name;
    if (title) freelancer.title = title;
    if (skills) {
      let skillsArray = [];
      try {
        skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
      } catch (e) {
        skillsArray = Array.isArray(skills) ? skills : [skills];
      }
      freelancer.skills = skillsArray;
    }
    if (department && ['Web Development', 'UI UX Designing', 'Graphic Designing', 'Amazon', 'Digital Marketing', 'Bookkeeping'].includes(department)) {
      freelancer.department = department;
    }
    if (linkedin) freelancer.linkedin = linkedin;
    
    await freelancer.save();
    
    res.json({
      success: true,
      data: freelancer,
      message: 'Freelancer updated successfully',
    });
  } catch (error) {
    console.error('Error updating freelancer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating freelancer',
    });
  }
});

// Delete a freelancer (protected - admin only)
router.delete('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id);
    
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found',
      });
    }
    
    // Delete associated image file if it exists
    if (freelancer.image) {
      const imagePath = path.join(__dirname, '..', 'public', freelancer.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Freelancer.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Freelancer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting freelancer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting freelancer',
    });
  }
});

export default router;

