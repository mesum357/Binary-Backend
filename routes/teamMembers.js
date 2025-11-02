import express from 'express';
import TeamMember from '../models/TeamMember.js';
import { protect, isAdminAuthenticated } from '../middleware/auth.js';
import { teamMemberUpload } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all team members (public for frontend, protected for admin)
router.get('/', async (req, res) => {
  try {
    const { team } = req.query; // Optional filter by team category
    
    const query = team ? { team } : {};
    const members = await TeamMember.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
    });
  }
});

// Get a single team member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }
    
    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Error fetching team member:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team member',
    });
  }
});

// Create a new team member (protected - admin only)
router.post('/', isAdminAuthenticated, teamMemberUpload.single('image'), async (req, res) => {
  try {
    const { name, designation, linkedin, team } = req.body;
    
    // Validate required fields
    if (!name || !designation || !linkedin || !team) {
      // If image was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    
    // Validate team category
    if (!['binary-hub', 'binary-digital'].includes(team)) {
      // If image was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Team must be either "binary-hub" or "binary-digital"',
      });
    }
    
    // Build image path if file was uploaded
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/team-members/${req.file.filename}`;
    }
    
    const member = new TeamMember({
      name,
      designation,
      linkedin,
      team,
      image: imagePath,
    });
    
    await member.save();
    
    res.status(201).json({
      success: true,
      data: member,
      message: 'Team member created successfully',
    });
  } catch (error) {
    // If image was uploaded but save failed, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(console.error);
    }
    console.error('Error creating team member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating team member',
    });
  }
});

// Update a team member (protected - admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, designation, linkedin, team } = req.body;
    
    const member = await TeamMember.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }
    
    // Update fields if provided
    if (name) member.name = name;
    if (designation) member.designation = designation;
    if (linkedin) member.linkedin = linkedin;
    if (team && ['binary-hub', 'binary-digital'].includes(team)) {
      member.team = team;
    }
    
    await member.save();
    
    res.json({
      success: true,
      data: member,
      message: 'Team member updated successfully',
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating team member',
    });
  }
});

// Delete a team member (protected - admin only)
router.delete('/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }
    
    // Delete associated image file if it exists
    if (member.image) {
      const imagePath = path.join(__dirname, '..', 'public', member.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await TeamMember.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting team member',
    });
  }
});

export default router;


