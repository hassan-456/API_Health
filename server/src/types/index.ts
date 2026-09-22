import { Types } from 'mongoose';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IApiEndpoint {
  _id: Types.ObjectId;
  name: string;
  url: string;
  method: HttpMethod;
  threshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastCheck?: IHealthCheck;
}

export interface IHealthCheck {
  _id: Types.ObjectId;
  apiId: Types.ObjectId;
  timestamp: Date;
  httpStatus?: number;
  responseTime?: number;
  success: boolean;
  thresholdExceeded: boolean;
  error?: string;
}

export interface CreateEndpointDto {
  name: string;
  url: string;
  method: HttpMethod;
  threshold: number;
  isActive?: boolean;
}

export interface UpdateEndpointDto {
  name?: string;
  url?: string;
  method?: HttpMethod;
  threshold?: number;
  isActive?: boolean;
}

export type IncidentType =
  | 'SERVICE_UNAVAILABLE'
  | 'SLOW_RESPONSE'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR';

export type IncidentStatus = 'OPEN' | 'RESOLVED';

export interface IIncident {
  _id: Types.ObjectId;
  apiId: Types.ObjectId;
  apiName: string;
  type: IncidentType;
  label: string;
  httpStatus?: number;
  responseTime?: number;
  error?: string;
  status: IncidentStatus;
  detectedAt: Date;
  lastSeenAt: Date;
  resolvedAt?: Date;
  healthCheckId?: Types.ObjectId;
}

export interface HealthCheckResult {
  apiId: string;
  timestamp: Date;
  httpStatus?: number;
  responseTime?: number;
  success: boolean;
  thresholdExceeded: boolean;
  error?: string;
}

export interface DashboardRecentCheck extends IHealthCheck {
  apiName: string;
  method: HttpMethod;
  endpointUrl: string;
}

export interface LatencyTrendPoint {
  time: string;
  at: string;
  avgLatency: number;
  threshold: number;
}

export interface DashboardData {
  totalApis: number;
  activeApis: number;
  inactiveApis: number;
  healthyApis: number;
  slowApis: number;
  failedApis: number;
  avgResponseTime: number;
  uptimePercentage: number;
  recentChecks: DashboardRecentCheck[];
  latencyTrend: LatencyTrendPoint[];
  openIncidents: number;
  recentIncidents: IIncident[];
}

export type ApiStatus = 'healthy' | 'slow' | 'failed' | 'inactive' | 'unknown';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
