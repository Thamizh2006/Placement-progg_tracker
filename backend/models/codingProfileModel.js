import mongoose from 'mongoose';

const activityPointSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    problemsSolved: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    contests: { type: Number, default: 0 },
  },
  { _id: false }
);

const platformStatsSchema = new mongoose.Schema(
  {
    username: { type: String, default: '' },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    contests: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    activityHistory: { type: [activityPointSchema], default: [] },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const codingProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    leetCode: { type: platformStatsSchema, default: () => ({}) },
    codeforces: { type: platformStatsSchema, default: () => ({}) },
    notes: { type: String, default: '' },
    overallConsistencyScore: { type: Number, default: 0 },
    placementReadinessScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CodingProfile = mongoose.model('CodingProfile', codingProfileSchema);

export default CodingProfile;
