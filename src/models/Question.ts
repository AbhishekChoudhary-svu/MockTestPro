import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  question: string;
  passage: string;            // shared passage for RC / Cloze / passage-based Qs
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  examCategory: string;  // dynamic — no hardcoded enum
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  usageCount: number;
}

const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    question: { type: String, required: true },
    passage: { type: String, default: '' },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    explanation: { type: String, default: '' },
    examCategory: { type: String, required: false, index: true, default: "" },
    subject: { type: String, required: true },
    topic: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
