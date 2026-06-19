import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResponse {
  questionId: mongoose.Types.ObjectId;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isMarkedForReview: boolean;
  timeSpent: number; // in seconds
}

export interface ISectionResult {
  sectionName: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSpent: number; // in seconds
  accuracy: number; // percentage
}

export interface IResult {
  totalScore: number;
  totalMarks: number;
  rank?: number;
  percentile?: number;
  sectionResults: ISectionResult[];
}

export interface IAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  status: 'in-progress' | 'submitted';
  startedAt: Date;
  submittedAt?: Date;
  currentSection: number; // index of the section in the exam
  responses: IResponse[];
  result?: IResult;
}

const ResponseSchema = new Schema<IResponse>({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
  isMarkedForReview: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },
});

const SectionResultSchema = new Schema<ISectionResult>({
  sectionName: { type: String, required: true },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true },
  skipped: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  accuracy: { type: Number, required: true },
});

const ResultSchema = new Schema<IResult>({
  totalScore: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  rank: { type: Number },
  percentile: { type: Number },
  sectionResults: [SectionResultSchema],
});

const AttemptSchema: Schema<IAttempt> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    status: { type: String, enum: ['in-progress', 'submitted'], default: 'in-progress', index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    currentSection: { type: Number, default: 0 },
    responses: [ResponseSchema],
    result: { type: ResultSchema },
  }
);

const Attempt: Model<IAttempt> = mongoose.models.Attempt || mongoose.model<IAttempt>('Attempt', AttemptSchema);

export default Attempt;
