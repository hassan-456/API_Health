export type IncidentType =
  | 'SERVICE_UNAVAILABLE'
  | 'SLOW_RESPONSE'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR';

export interface ClassifiedIncident {
  type: IncidentType;
  label: string;
}

/**
 * Classifies the outcome of a health check into an incident category.
 *
 * Rules:
 *  - No response captured (network error, timeout, DNS failure, connection
 *    refused, etc.) -> Service Unavailable
 *  - Response received but HTTP status >= 500                -> Server Error – HTTP {status}
 *  - Response received but HTTP status 400-499                -> Client Error – HTTP {status}
 *  - Response succeeded (2xx/3xx) but exceeded the configured
 *    latency threshold                                        -> Slow Response
 *  - Response succeeded and within threshold                  -> null (no incident)
 */
export const classifyIncident = (check: {
  success: boolean;
  httpStatus?: number;
  thresholdExceeded: boolean;
}): ClassifiedIncident | null => {
  if (!check.success) {
    if (check.httpStatus === undefined || check.httpStatus === null) {
      return { type: 'SERVICE_UNAVAILABLE', label: 'Service Unavailable' };
    }
    if (check.httpStatus >= 500) {
      return {
        type: 'SERVER_ERROR',
        label: `Server Error – HTTP ${check.httpStatus}`,
      };
    }
    if (check.httpStatus >= 400) {
      return {
        type: 'CLIENT_ERROR',
        label: `Client Error – HTTP ${check.httpStatus}`,
      };
    }
    // Any other non-successful status (rare) still represents an outage.
    return { type: 'SERVICE_UNAVAILABLE', label: 'Service Unavailable' };
  }

  if (check.thresholdExceeded) {
    return { type: 'SLOW_RESPONSE', label: 'Slow Response' };
  }

  return null;
};
