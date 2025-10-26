import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  player1Id: mongoose.Types.ObjectId;
  player2Id: mongoose.Types.ObjectId;
  deck1: string;
  deck2: string;
  format: 'best-of-1' | 'best-of-3';
  winner: mongoose.Types.ObjectId | null;
  status: 'Pending' | 'Completed' | 'Disputed';
  reports: Array<{
    reportedBy: mongoose.Types.ObjectId;
    reportedWinner: mongoose.Types.ObjectId;
    reportedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>({
  player1Id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2Id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deck1: {
    type: String,
    required: true
  },
  deck2: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['best-of-1', 'best-of-3'],
    required: true
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Disputed'],
    default: 'Pending'
  },
  reports: [{
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedWinner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
MatchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
