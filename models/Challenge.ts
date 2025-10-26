import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  challengerId: mongoose.Types.ObjectId;
  challengedId: mongoose.Types.ObjectId;
  proposedFormat: 'bo1' | 'bo3';
  challengerDeck: string;
  challengedDeck: string | null;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Locked' | 'Expired';
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
  proposedFormat: {
    type: String,
    enum: ['bo1', 'bo3'],
    required: true
  },
  challengerDeck: {
    type: String,
    required: true
  },
  challengedDeck: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined', 'Locked', 'Expired'],
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
