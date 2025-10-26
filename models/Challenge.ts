import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  challengerId: mongoose.Types.ObjectId;
  challengedId: mongoose.Types.ObjectId;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired';
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>({
  challengerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengedId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined', 'Expired'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ChallengeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);
