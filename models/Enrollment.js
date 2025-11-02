import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  course: {
    slug: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  user: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
  },
  payment: {
    method: {
      type: String,
      enum: ['easypaisa', 'bank'],
      required: true,
    },
    screenshot: {
      type: String, // File path or URL
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  message: {
    type: String,
    required: false,
  },
  purchaseDate: {
    type: Date,
    required: false,
  },
  expirationDate: {
    type: Date,
    required: false,
  },
  renewalNotificationSent: {
    type: Boolean,
    default: false,
  },
  expired: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;

