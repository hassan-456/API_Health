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

export interface HealthCheckResult {
  apiId: string;
  timestamp: Date;
  httpStatus?: number;
  responseTime?: number;
  success: boolean;
  thresholdExceeded: boolean;
  error?: string;
}

export interface DashboardData {
  totalApis: number;
  activeApis: number;
  inactiveApis: number;
  healthyApis: number;
  slowApis: number;
  failedApis: number;
  avgResponseTime: number;
  recentChecks: IHealthCheck[];
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
