// Shared User model so auth + /api/users handlers see the same collection.
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  operatorId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Operator' },
  shift: String,
  location: String,
  pinHash: { type: String, required: true, select: false },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Number, default: 0 },
}, { versionKey: false });

export const UserModel = mongoose.models.User ?? mongoose.model('User', UserSchema);
