import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['5lpa', '7lpa', '10lpa'],
      default: null,
    },
    taskName: {
      type: String,
      default: null,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    aiSuggestion: {
      summary: {
        type: String,
        default: null,
      },
      detectedTopics: {
        type: [String],
        default: [],
      },
      hints: {
        type: [String],
        default: [],
      },
      solutionOutline: {
        type: [String],
        default: [],
      },
      mentorDraft: {
        type: String,
        default: null,
      },
    },
    response: {
      type: String,
      default: null,
    },
    responseDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Doubt = mongoose.model('Doubt', doubtSchema);

export default Doubt;
