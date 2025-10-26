import mongoose, { Document, Schema } from 'mongoose';

export interface ISeason extends Document {
  seasonNum: number;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

const SeasonSchema = new Schema<ISeason>({
  seasonNum: {
    type: Number,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Season || mongoose.model<ISeason>('Season', SeasonSchema);
