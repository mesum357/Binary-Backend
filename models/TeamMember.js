import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
  },
  linkedin: {
    type: String,
    required: [true, 'LinkedIn URL is required'],
    trim: true,
    match: [/^https:\/\/.*linkedin\.com\/.*/, 'Must be a valid LinkedIn URL'],
  },
  team: {
    type: String,
    required: [true, 'Team category is required'],
    enum: ['binary-hub', 'binary-digital'],
    default: 'binary-hub',
  },
  image: {
    type: String,
    required: false,
    trim: true,
  },
}, {
  timestamps: true,
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;


