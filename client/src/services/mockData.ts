import type { ApiEndpoint, HealthCheck, DashboardStats, Incident } from '../types';
import { classifyIncident } from '../lib/incidentClassifier';

export const INITIAL_ENDPOINTS: ApiEndpoint[] = [
  {
    _id: 'ep-1',
    name: 'User Accounts Service',
    url: 'https://api.github.com/users/octocat',
    method: 'GET',
    threshold: 250,
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: {
      _id: 'hc-1',
      apiId: 'ep-1',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      httpStatus: 200,
      responseTime: 142,
      success: true,
      thresholdExceeded: false,
    },
  },
  {
    _id: 'ep-2',
    name: 'OAuth2 Authentication Service',
    url: 'https://httpbin.org/status/200',
    method: 'POST',
    threshold: 200,
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: {
      _id: 'hc-2',
      apiId: 'ep-2',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      httpStatus: 200,
      responseTime: 88,
      success: true,
      thresholdExceeded: false,
    },
  },
  {
    _id: 'ep-3',
    name: 'Order Fulfillment & Checkout',
    url: 'https://httpbin.org/delay/1',
    method: 'POST',
    threshold: 450,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: {
      _id: 'hc-3',
      apiId: 'ep-3',
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      httpStatus: 200,
      responseTime: 672,
      success: true,
      thresholdExceeded: true,
    },
  },
  {
    _id: 'ep-4',
    name: 'Global Payment Gateway',
    url: 'https://api.stripe.com/healthcheck',
    method: 'POST',
    threshold: 500,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: {
      _id: 'hc-4',
      apiId: 'ep-4',
      timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
      httpStatus: 503,
      responseTime: 1240,
      success: false,
      thresholdExceeded: true,
      error: 'Upstream gateway timeout: 503 Service Unavailable',
    },
  },
  {
    _id: 'ep-5',
    name: 'Product Catalog & Inventory',
    url: 'https://dummyjson.com/products/1',
    method: 'GET',
    threshold: 300,
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: {
      _id: 'hc-5',
      apiId: 'ep-5',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      httpStatus: 200,
      responseTime: 186,
      success: true,
      thresholdExceeded: false,
    },
  },
  {
    _id: 'ep-6',
    name: 'Real-time Telemetry Ingestion',
    url: 'https://httpbin.org/delay/1',
    method: 'POST',
    threshold: 400,
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: {
      _id: 'hc-6',
      apiId: 'ep-6',
      timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
      httpStatus: 200,
      responseTime: 495,
      success: true,
      thresholdExceeded: true,
    },
  },
  {
    _id: 'ep-7',
    name: 'Legacy SMS Webhook Dispatcher',
    url: 'https://notifications.internal.corp/webhook',
    method: 'POST',
    threshold: 1000,
    isActive: false,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheck: undefined,
  },
];

// Generate 20 realistic historical checks for an endpoint
export function generateEndpointHistory(endpoint: ApiEndpoint): HealthCheck[] {
  const history: HealthCheck[] = [];
  const now = Date.now();
  const step = 30 * 60 * 1000; // 30 mins apart

  for (let i = 0; i < 24; i++) {
    const time = new Date(now - i * step).toISOString();
    let responseTime = 0;
    let success = true;
    let httpStatus: number | undefined = 200;
    let thresholdExceeded = false;
    let error: string | undefined = undefined;

    if (!endpoint.isActive) {
      continue;
    }

    if (endpoint._id === 'ep-4') { // Payment gateway: intermittently fails
      if (i % 3 === 0) {
        success = false;
        httpStatus = 503;
        responseTime = 1100 + Math.floor(Math.random() * 500);
        thresholdExceeded = true;
        error = 'HTTP 503 Service Unavailable';
      } else {
        success = true;
        responseTime = 380 + Math.floor(Math.random() * 140);
        thresholdExceeded = responseTime > endpoint.threshold;
      }
    } else if (endpoint._id === 'ep-3' || endpoint._id === 'ep-6') { // Slow endpoints
      responseTime = endpoint.threshold + 80 + Math.floor(Math.random() * 250);
      thresholdExceeded = true;
      success = true;
    } else { // Healthy
      responseTime = Math.max(45, endpoint.threshold - 100 + Math.floor(Math.random() * 70));
      thresholdExceeded = responseTime > endpoint.threshold;
      success = true;
    }

    history.push({
      _id: `hc-${endpoint._id}-${i}`,
      apiId: endpoint._id,
      timestamp: time,
      httpStatus,
      responseTime,
      success,
      thresholdExceeded,
      error,
    });
  }

  return history;
}

/**
 * Applies a single health check to an endpoint's incident timeline, mirroring
 * the backend's open -> update -> resolve lifecycle (see incident.service.ts):
 *  - A problem is classified and none is open for this endpoint -> open one.
 *  - A problem is classified and one is already open             -> refresh it.
 *  - The check is healthy and one is open                        -> resolve it.
 * Returns a new incidents array (does not mutate the input).
 */
export function applyCheckToIncidents(
  incidents: Incident[],
  endpoint: ApiEndpoint,
  check: HealthCheck
): Incident[] {
  const classification = classifyIncident({
    success: check.success,
    httpStatus: check.httpStatus,
    thresholdExceeded: check.thresholdExceeded,
  });

  const next = incidents.slice();
  const openIndex = next.findIndex(
    (inc) => inc.apiId === endpoint._id && inc.status === 'OPEN'
  );

  if (!classification) {
    if (openIndex !== -1) {
      next[openIndex] = {
        ...next[openIndex],
        status: 'RESOLVED',
        resolvedAt: check.timestamp,
        lastSeenAt: check.timestamp,
      };
    }
    return next;
  }

  if (openIndex !== -1) {
    next[openIndex] = {
      ...next[openIndex],
      type: classification.type,
      label: classification.label,
      httpStatus: check.httpStatus,
      responseTime: check.responseTime,
      error: check.error,
      lastSeenAt: check.timestamp,
    };
    return next;
  }

  next.push({
    _id: `inc-${endpoint._id}-${check._id}`,
    apiId: endpoint._id,
    apiName: endpoint.name,
    type: classification.type,
    label: classification.label,
    httpStatus: check.httpStatus,
    responseTime: check.responseTime,
    error: check.error,
    status: 'OPEN',
    detectedAt: check.timestamp,
    lastSeenAt: check.timestamp,
  });

  return next;
}

// Build the initial incident timeline for demo mode by replaying each
// endpoint's generated history chronologically through the same lifecycle
// used for live checks, so Demo Mode and the live backend behave identically.
export function deriveInitialIncidents(
  endpoints: ApiEndpoint[],
  checksHistory: Record<string, HealthCheck[]>
): Incident[] {
  let incidents: Incident[] = [];

  endpoints.forEach((ep) => {
    const history = (checksHistory[ep._id] || [])
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    history.forEach((check) => {
      incidents = applyCheckToIncidents(incidents, ep, check);
    });
  });

  return incidents;
}

export function computeDashboardStats(
  endpoints: ApiEndpoint[],
  checksHistory: Record<string, HealthCheck[]>,
  incidents: Incident[] = []
): DashboardStats {
  const totalApis = endpoints.length;
  const activeApis = endpoints.filter((e) => e.isActive).length;

  let healthyApis = 0;
  let slowApis = 0;
  let failedApis = 0;

  endpoints.forEach((ep) => {
    if (!ep.isActive) return;
    if (!ep.lastCheck) {
      healthyApis++;
      return;
    }
    if (!ep.lastCheck.success) {
      failedApis++;
    } else if (ep.lastCheck.thresholdExceeded) {
      slowApis++;
    } else {
      healthyApis++;
    }
  });

  // Calculate average response time across active endpoints with recent checks
  const checkedEndpoints = endpoints.filter((e) => e.isActive && e.lastCheck?.responseTime);
  const avgResponseTime = checkedEndpoints.length > 0
    ? Math.round(checkedEndpoints.reduce((sum, e) => sum + (e.lastCheck?.responseTime || 0), 0) / checkedEndpoints.length)
    : 0;

  // Recent checks feed
  const allChecks: (HealthCheck & { apiName: string; method: ApiEndpoint['method']; endpointUrl: string })[] = [];
  endpoints.forEach((ep) => {
    const list = checksHistory[ep._id] || [];
    list.forEach((c) => {
      allChecks.push({
        ...c,
        apiName: ep.name,
        method: ep.method,
        endpointUrl: ep.url,
      });
    });
  });

  allChecks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentChecks = allChecks.slice(0, 15);

  // Latency trend over last 6 time intervals
  const latencyTrend = [
    { time: '12:00', avgLatency: 145, threshold: 300 },
    { time: '13:00', avgLatency: 168, threshold: 300 },
    { time: '14:00', avgLatency: 289, threshold: 300 },
    { time: '15:00', avgLatency: 215, threshold: 300 },
    { time: '16:00', avgLatency: 198, threshold: 300 },
    { time: '17:00', avgLatency: avgResponseTime || 185, threshold: 300 },
  ];

  const openIncidents = incidents.filter((inc) => inc.status === 'OPEN').length;
  const recentIncidents = incidents
    .slice()
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, 5);

  return {
    totalApis,
    activeApis,
    healthyApis,
    slowApis,
    failedApis,
    avgResponseTime,
    uptimePercentage: 99.4,
    recentChecks,
    latencyTrend,
    openIncidents,
    recentIncidents,
  };
}
