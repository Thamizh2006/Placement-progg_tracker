import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['mock-interview', 'assessment', 'exam', 'company-visit', 'announcement'],
      default: 'announcement',
    },
    company: {
      type: String,
      default: null,
      trim: true,
    },
    eventDate: {
      type: Date,
      default: null,
    },
    venue: {
      type: String,
      default: null,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorRole: {
      type: String,
      enum: ['faculty', 'hod', 'placement', 'superadmin'],
      required: true,
    },
  },
  { timestamps: true }
);

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;
