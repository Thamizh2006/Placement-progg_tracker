import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['progress', 'eligibility', 'complete'],
      default: 'complete',
    },
    category: {
      type: String,
      enum: ['5lpa', '7lpa', '10lpa'],
      default: null,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    completedTasks: [
      {
        rowTitle: String,
        taskName: String,
        completedAt: Date,
      },
    ],
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTaskCount: {
      type: Number,
      default: 0,
    },
    eligible: {
      type: Boolean,
      default: false,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
