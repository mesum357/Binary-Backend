import mongoose from 'mongoose';

const freelancerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  skills: {
    type: [String],
    required: [true, 'At least one skill is required'],
    validate: {
      validator: (skills) => skills.length > 0,
      message: 'At least one skill is required',
    },
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Web Development', 'UI UX Designing', 'Graphic Designing', 'Amazon', 'Digital Marketing', 'Bookkeeping'],
    trim: true,
  },
  linkedin: {
    type: String,
    required: [true, 'LinkedIn URL is required'],
    trim: true,
    match: [/^https:\/\/.*linkedin\.com\/.*/, 'Must be a valid LinkedIn URL'],
  },
  image: {
    type: String,
    required: false,
    trim: true,
  },
}, {
  timestamps: true,
});

const Freelancer = mongoose.model('Freelancer', freelancerSchema);

export default Freelancer;

