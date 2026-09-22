import mongoose, { Schema, Model } from 'mongoose';
import { IApiEndpoint, HttpMethod } from '../types';

const apiEndpointSchema = new Schema<IApiEndpoint>(
  {
    name: {
      type: String,
      required: [true, 'API name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    method: {
      type: String,
      required: [true, 'HTTP method is required'],
      enum: {
        values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[],
        message: '{VALUE} is not a valid HTTP method',
      },
      default: 'GET',
    },
    threshold: {
      type: Number,
      required: [true, 'Response threshold is required'],
      min: [1, 'Threshold must be at least 1ms'],
      max: [60000, 'Threshold cannot exceed 60 seconds'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

apiEndpointSchema.index({ isActive: 1 });
apiEndpointSchema.index({ name: 'text' });

const ApiEndpoint: Model<IApiEndpoint> = mongoose.model<IApiEndpoint>(
  'ApiEndpoint',
  apiEndpointSchema
);

export default ApiEndpoint;
