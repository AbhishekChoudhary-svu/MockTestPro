import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarkingScheme {
  correct: number;
  wrong: number;
}

export interface ISection {
  name: string;
  duration: number; // in minutes
  questionCount: number;
  questions: mongoose.Types.ObjectId[];
  markingScheme: IMarkingScheme;
}

export interface IExam extends Document {
  title: string;
  category: string;  // dynamic — no hardcoded enum
  totalDuration: number; // in minutes
  sections: ISection[];
  instructions: string;
  status: 'draft' | 'upcoming' | 'live';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  attemptCount: number;
}

const SectionSchema = new Schema<ISection>({
  name: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  questionCount: { type: Number, required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question', required: true }],
  markingScheme: {
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
  },
});

const ExamSchema: Schema<IExam> = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true, index: true },
    totalDuration: { type: Number, required: true }, // in minutes
    sections: [SectionSchema],
    instructions: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'upcoming', 'live'], default: 'draft', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attemptCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const Exam: Model<IExam> = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);

export default Exam;
