import mongoose, { Schema, Model } from 'mongoose';
import { IHealthCheck } from '../types';

const healthCheckSchema = new Schema<IHealthCheck>(
  {
    apiId: {
      type: Schema.Types.ObjectId,
      ref: 'ApiEndpoint',
      required: [true, 'API ID is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    httpStatus: {
      type: Number,
    },
    responseTime: {
      type: Number,
    },
    success: {
      type: Boolean,
      required: true,
    },
    thresholdExceeded: {
      type: Boolean,
      required: true,
      default: false,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries: get checks for an API sorted by time
healthCheckSchema.index({ apiId: 1, timestamp: -1 });

const HealthCheck: Model<IHealthCheck> = mongoose.model<IHealthCheck>(
  'HealthCheck',
  healthCheckSchema
);

export default HealthCheck;
