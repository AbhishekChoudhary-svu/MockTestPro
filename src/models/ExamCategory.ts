import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExamCategory extends Document {
  name: string;
  createdAt: Date;
}

const ExamCategorySchema = new Schema<IExamCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }
);

const ExamCategory: Model<IExamCategory> =
  mongoose.models.ExamCategory || mongoose.model<IExamCategory>('ExamCategory', ExamCategorySchema);

export default ExamCategory;
