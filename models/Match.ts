import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  player1Id: mongoose.Types.ObjectId;
  player2Id: mongoose.Types.ObjectId;
  deck1: string;
  deck2: string;
  format: 'best-of-1' | 'best-of-3';
  winner: mongoose.Types.ObjectId | null;
  status: 'Pending' | 'Completed' | 'Disputed';
  // ELO tracking fields
  eloLifetimeStartP1: number;
  eloLifetimeStartP2: number;
  eloSeasonalStartP1: number;
  eloSeasonalStartP2: number;
  resolvedP1GamesWon: number | null;
  // Updated reports structure
  reports: Array<{
    reporterId: mongoose.Types.ObjectId;
    reportedWinnerId: mongoose.Types.ObjectId;
    reportedP1GamesWon: number;
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
  // ELO tracking fields
  eloLifetimeStartP1: {
    type: Number,
    required: true
  },
  eloLifetimeStartP2: {
    type: Number,
    required: true
  },
  eloSeasonalStartP1: {
    type: Number,
    required: true
  },
  eloSeasonalStartP2: {
    type: Number,
    required: true
  },
  resolvedP1GamesWon: {
    type: Number,
    default: null
  },
  // Updated reports structure
  reports: [{
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedWinnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedP1GamesWon: {
      type: Number,
      required: true,
      min: 0
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
