import mongoose, { Schema, Document } from 'mongoose';
import { Insights, BookingInfo } from '../types';

export interface IInsightsCache extends Document {
  place_id: string;
  insights: Insights;
  booking: BookingInfo;
}

const InsightsCacheSchema = new Schema<IInsightsCache>(
  { place_id: { type: String, required: true, unique: true }, insights: Schema.Types.Mixed, booking: Schema.Types.Mixed },
  { timestamps: true }
);

InsightsCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 86400 }); // 7 days

export default mongoose.model<IInsightsCache>('InsightsCache', InsightsCacheSchema);
