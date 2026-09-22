export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type EndpointStatus = 'HEALTHY' | 'SLOW' | 'FAILED' | 'INACTIVE';

export interface HealthCheck {
  _id: string;
  apiId: string;
  timestamp: string;
  httpStatus?: number;
  responseTime?: number;
  success: boolean;
  thresholdExceeded: boolean;
  error?: string;
}

export interface ApiEndpoint {
  _id: string;
  name: string;
  url: string;
  method: HttpMethod;
  threshold: number; // in milliseconds
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheck?: HealthCheck;
}

export interface RecentCheckWithEndpoint extends HealthCheck {
  apiName: string;
  method: HttpMethod;
  endpointUrl: string;
}

export interface DashboardStats {
  totalApis: number;
  activeApis: number;
  healthyApis: number;
  slowApis: number;
  failedApis: number;
  avgResponseTime: number;
  uptimePercentage: number;
  recentChecks: RecentCheckWithEndpoint[];
  latencyTrend: {
    time: string;
    at?: string;
    avgLatency: number;
    threshold: number;
  }[];
  openIncidents: number;
  recentIncidents: Incident[];
}

export type IncidentType =
  | 'SERVICE_UNAVAILABLE'
  | 'SLOW_RESPONSE'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR';

export type IncidentStatus = 'OPEN' | 'RESOLVED';

export interface Incident {
  _id: string;
  apiId: string;
  apiName: string;
  type: IncidentType;
  label: string;
  httpStatus?: number;
  responseTime?: number;
  error?: string;
  status: IncidentStatus;
  detectedAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
}

export interface CreateEndpointDto {
  name: string;
  url: string;
  method: HttpMethod;
  threshold: number;
  isActive: boolean;
}

export interface UpdateEndpointDto extends Partial<CreateEndpointDto> {}
