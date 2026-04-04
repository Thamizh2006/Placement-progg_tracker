import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['student', 'faculty', 'hod', 'placement', 'superadmin'],
      default: 'student',
      required: true,
    },

    department: {
      type: String,
      enum: [
        'CSE',
        'ECE',
        'EEE',
        'MECH',
        'ADS',
        'IT',
        'CYBER SECURITY',
        'CHEMICAL',
        'BIOTECHNOLOGY',
        'ALL',
      ],
      required: function () {
        return ['student', 'faculty', 'hod'].includes(this.role);
      },
    },

    selectedCategory: {
      type: String,
      enum: ['5lpa', '7lpa', '10lpa'],
      default: null,
    },

    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
