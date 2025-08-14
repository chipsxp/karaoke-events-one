import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  eventId: string;
  raterId: string;
  rateeId: string;
  rating: number;
  review?: string;
  type: 'kj_rating' | 'ks_rating';
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>({
  eventId: { type: String, required: true, index: true },
  raterId: { type: String, required: true, index: true },
  rateeId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, maxlength: 500 },
  type: { 
    type: String, 
    required: true,
    enum: ['kj_rating', 'ks_rating']
  }
}, {
  timestamps: true
});

ratingSchema.index({ eventId: 1, raterId: 1, rateeId: 1 }, { unique: true });
ratingSchema.index({ rateeId: 1 });

export const Rating = mongoose.models.Rating || mongoose.model<IRating>('Rating', ratingSchema);