import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
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

const Mentor = mongoose.model('Mentor', mentorSchema);

export default Mentor;


