import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'admin';
  targetExam?: string;
  state?: string;
  streak: number;
  createdAt: Date;
  lastLogin: Date;
  isBanned: boolean;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    googleId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    targetExam: { type: String },
    state: { type: String },
    streak: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
