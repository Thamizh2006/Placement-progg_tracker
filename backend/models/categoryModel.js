import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, enum: ['5lpa', '7lpa', '10lpa'], required: true, unique: true },
  rows: [
    {
      title: String,
      tasks: [String],
    },
  ],
});
const category = mongoose.model('Category', categorySchema);
export default category;
