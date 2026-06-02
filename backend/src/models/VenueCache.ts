// Mongoose model that caches venue results so identical queries skip the APIs
import mongoose, { Schema, Document } from 'mongoose';
import { VenueResult } from '../types';

export interface IVenueCache extends Document {
  key: string;
  results: VenueResult[];
}

const VenueCacheSchema = new Schema<IVenueCache>(
  {
    key: { type: String, required: true, unique: true },
    // Mixed allows arbitrary nested objects without strict sub-schemas
    results: [Schema.Types.Mixed],
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// MongoDB TTL index: remove cached documents after 24 hours
VenueCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IVenueCache>('VenueCache', VenueCacheSchema);
