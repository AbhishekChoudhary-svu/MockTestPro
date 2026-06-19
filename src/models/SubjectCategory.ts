import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubjectCategory extends Document {
  name: string;
  examCategory: string; // references the exam category name (e.g., "SSC")
  createdAt: Date;
}

const SubjectCategorySchema = new Schema<ISubjectCategory>(
  {
    name: { type: String, required: true, trim: true },
    examCategory: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }
);

// Prevent duplicate subject names under the same exam category
SubjectCategorySchema.index({ name: 1, examCategory: 1 }, { unique: true });

const SubjectCategory: Model<ISubjectCategory> =
  mongoose.models.SubjectCategory || mongoose.model<ISubjectCategory>('SubjectCategory', SubjectCategorySchema);

export default SubjectCategory;
