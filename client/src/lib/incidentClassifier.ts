import type { IncidentType } from '../types';

export interface ClassifiedIncident {
  type: IncidentType;
  label: string;
}

/**
 * Mirrors the backend's classification rules (server/src/utils/incidentClassifier.ts)
 * so Demo Mode (no live backend) shows identical incident labels:
 *
 *  - No response captured                     -> Service Unavailable
 *  - Response received, HTTP status >= 500     -> Server Error – HTTP {status}
 *  - Response received, HTTP status 400-499    -> Client Error – HTTP {status}
 *  - Success but over the latency threshold    -> Slow Response
 *  - Success and within threshold              -> null (no incident)
 */
export function classifyIncident(check: {
  success: boolean;
  httpStatus?: number;
  thresholdExceeded: boolean;
}): ClassifiedIncident | null {
  if (!check.success) {
    if (check.httpStatus === undefined || check.httpStatus === null) {
      return { type: 'SERVICE_UNAVAILABLE', label: 'Service Unavailable' };
    }
    if (check.httpStatus >= 500) {
      return { type: 'SERVER_ERROR', label: `Server Error – HTTP ${check.httpStatus}` };
    }
    if (check.httpStatus >= 400) {
      return { type: 'CLIENT_ERROR', label: `Client Error – HTTP ${check.httpStatus}` };
    }
    return { type: 'SERVICE_UNAVAILABLE', label: 'Service Unavailable' };
  }

  if (check.thresholdExceeded) {
    return { type: 'SLOW_RESPONSE', label: 'Slow Response' };
  }

  return null;
}
