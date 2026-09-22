import mongoose, { Schema, Model } from 'mongoose';
import { IIncident, IncidentType, IncidentStatus } from '../types';

const INCIDENT_TYPES: IncidentType[] = [
  'SERVICE_UNAVAILABLE',
  'SLOW_RESPONSE',
  'CLIENT_ERROR',
  'SERVER_ERROR',
];

const INCIDENT_STATUSES: IncidentStatus[] = ['OPEN', 'RESOLVED'];

const incidentSchema = new Schema<IIncident>(
  {
    apiId: {
      type: Schema.Types.ObjectId,
      ref: 'ApiEndpoint',
      required: [true, 'API ID is required'],
      index: true,
    },
    apiName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: INCIDENT_TYPES,
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
    },
    httpStatus: {
      type: Number,
    },
    responseTime: {
      type: Number,
    },
    error: {
      type: String,
    },
    status: {
      type: String,
      enum: INCIDENT_STATUSES,
      required: true,
      default: 'OPEN',
      index: true,
    },
    detectedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    healthCheckId: {
      type: Schema.Types.ObjectId,
      ref: 'HealthCheck',
    },
  },
  {
    timestamps: false,
  }
);

// One endpoint should only have a single OPEN incident at a time.
incidentSchema.index({ apiId: 1, status: 1 });
incidentSchema.index({ detectedAt: -1 });

const Incident: Model<IIncident> = mongoose.model<IIncident>(
  'Incident',
  incidentSchema
);

export default Incident;
