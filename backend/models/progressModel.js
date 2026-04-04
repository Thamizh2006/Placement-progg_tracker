import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    category: {
      type: String,
      enum: ['5lpa', '7lpa', '10lpa'],
      required: true,
    },

    completedTasks: [
      {
        rowTitle: {
          type: String,
          required: true,
        },
        taskName: {
          type: String,
          required: true,
        },
        proofUrl: {
          type: String,
          default: null,
        },
        proofType: {
          type: String,
          enum: ['screenshot', 'document', null],
          default: null,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    progressPercentage: {
      type: Number,
      default: 0,
    },

    eligible: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
