import axios from 'axios';
import type {
  ApiEndpoint,
  HealthCheck,
  DashboardStats,
  CreateEndpointDto,
  UpdateEndpointDto,
} from '../types';
import {
  INITIAL_ENDPOINTS,
  generateEndpointHistory,
  computeDashboardStats,
} from './mockData';

const LOCAL_STORAGE_ENDPOINTS_KEY = 'pulsewatch_endpoints';
const LOCAL_STORAGE_HISTORY_KEY = 'pulsewatch_history';

// In-memory or localStorage cache for demo mode
function getStoredEndpoints(): ApiEndpoint[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ENDPOINTS_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // ignore
  }
  return INITIAL_ENDPOINTS;
}

function saveStoredEndpoints(endpoints: ApiEndpoint[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ENDPOINTS_KEY, JSON.stringify(endpoints));
  } catch {
    // ignore
  }
}

function getStoredHistory(): Record<string, HealthCheck[]> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // ignore
  }

  // Pre-fill history for initial endpoints
  const historyMap: Record<string, HealthCheck[]> = {};
  INITIAL_ENDPOINTS.forEach((ep) => {
    historyMap[ep._id] = generateEndpointHistory(ep);
  });
  saveStoredHistory(historyMap);
  return historyMap;
}

function saveStoredHistory(history: Record<string, HealthCheck[]>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

let backendHealthy = false;

// Check if backend is actually reachable
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const res = await axios.get('/api/endpoints', { timeout: 1500 });
    backendHealthy = res.status === 200;
    return backendHealthy;
  } catch {
    backendHealthy = false;
    return false;
  }
}

export const api = {
  isBackendHealthy: () => backendHealthy,

  async getDashboard(): Promise<DashboardStats> {
    try {
      const res = await axios.get('/api/dashboard', { timeout: 1500 });
      if (res.data?.success && res.data.data) {
        backendHealthy = true;
        return res.data.data;
      }
    } catch {
      backendHealthy = false;
    }

    // Local fallback
    const endpoints = getStoredEndpoints();
    const history = getStoredHistory();
    return computeDashboardStats(endpoints, history);
  },

  async getEndpoints(): Promise<ApiEndpoint[]> {
    try {
      const res = await axios.get('/api/endpoints', { timeout: 1500 });
      if (res.data?.success && Array.isArray(res.data.data)) {
        backendHealthy = true;
        return res.data.data;
      }
    } catch {
      backendHealthy = false;
    }

    return getStoredEndpoints();
  },

  async getEndpoint(id: string): Promise<ApiEndpoint | null> {
    try {
      const res = await axios.get(`/api/endpoints/${id}`, { timeout: 1500 });
      if (res.data?.success && res.data.data) {
        backendHealthy = true;
        return res.data.data;
      }
    } catch {
      backendHealthy = false;
    }

    const endpoints = getStoredEndpoints();
    return endpoints.find((e) => e._id === id) || null;
  },

  async createEndpoint(data: CreateEndpointDto): Promise<ApiEndpoint> {
    try {
      const res = await axios.post('/api/endpoints', data, { timeout: 2000 });
      if (res.data?.success && res.data.data) {
        backendHealthy = true;
        return res.data.data;
      }
    } catch {
      backendHealthy = false;
    }

    // Fallback: local create
    const endpoints = getStoredEndpoints();
    const newEp: ApiEndpoint = {
      _id: `ep-${Date.now()}`,
      name: data.name,
      url: data.url,
      method: data.method,
      threshold: Number(data.threshold) || 300,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    endpoints.unshift(newEp);
    saveStoredEndpoints(endpoints);

    // Initial check
    if (newEp.isActive) {
      await this.executeCheck(newEp._id);
    }

    return newEp;
  },

  async updateEndpoint(id: string, data: UpdateEndpointDto): Promise<ApiEndpoint> {
    try {
      const res = await axios.put(`/api/endpoints/${id}`, data, { timeout: 2000 });
      if (res.data?.success && res.data.data) {
        backendHealthy = true;
        return res.data.data;
      }
    } catch {
      backendHealthy = false;
    }

    const endpoints = getStoredEndpoints();
    const index = endpoints.findIndex((e) => e._id === id);
    if (index === -1) {
      throw new Error('Endpoint not found');
    }

    endpoints[index] = {
      ...endpoints[index],
      ...data,
      threshold: data.threshold !== undefined ? Number(data.threshold) : endpoints[index].threshold,
      updatedAt: new Date().toISOString(),
    };

    saveStoredEndpoints(endpoints);
    return endpoints[index];
  },

  async deleteEndpoint(id: string): Promise<void> {
    try {
      await axios.delete(`/api/endpoints/${id}`, { timeout: 2000 });
      backendHealthy = true;
    } catch {
      backendHealthy = false;
    }

    const endpoints = getStoredEndpoints().filter((e) => e._id !== id);
    saveStoredEndpoints(endpoints);

    const history = getStoredHistory();
    delete history[id];
    saveStoredHistory(history);
  },

  async executeCheck(id: string): Promise<HealthCheck> {
    try {
      const res = await axios.post(`/api/endpoints/${id}/check`, {}, { timeout: 12000 });
      if (res.data?.success && res.data.data) {
        backendHealthy = true;
        return res.data.data;
      }
    } catch {
      backendHealthy = false;
    }

    // Local simulation with real network attempt when possible
    const endpoints = getStoredEndpoints();
    const endpoint = endpoints.find((e) => e._id === id);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }

    if (!endpoint.isActive) {
      throw new Error('Cannot check an inactive API endpoint');
    }

    const startTime = performance.now();
    let httpStatus: number | undefined = 200;
    let responseTime = 0;
    let success = true;
    let error: string | undefined = undefined;

    try {
      // Attempt real fetch with 6s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method === 'GET' ? 'GET' : 'HEAD',
        signal: controller.signal,
        mode: 'no-cors', // avoid CORS blocking basic alive ping
      });
      clearTimeout(timeoutId);
      
      const endTime = performance.now();
      responseTime = Math.round(endTime - startTime);
      httpStatus = response.status || 200;
      success = true;
    } catch (err: any) {
      const endTime = performance.now();
      responseTime = Math.round(endTime - startTime);
      
      // If it looks like a demo endpoint with simulated errors
      if (endpoint._id === 'ep-4' || endpoint.url.includes('stripe') || endpoint.url.includes('fail')) {
        success = false;
        httpStatus = 503;
        error = 'Network error: Service Unavailable / Connection Refused';
      } else {
        // Successful response even if CORS restricted status code
        success = true;
        httpStatus = 200;
        if (responseTime <= 0) {
          responseTime = Math.round(endpoint.threshold * 0.75 + Math.random() * 40);
        }
      }
    }

    const thresholdExceeded = responseTime > endpoint.threshold;

    const newCheck: HealthCheck = {
      _id: `hc-${Date.now()}`,
      apiId: endpoint._id,
      timestamp: new Date().toISOString(),
      httpStatus,
      responseTime,
      success,
      thresholdExceeded,
      error,
    };

    // Update endpoint lastCheck
    endpoint.lastCheck = newCheck;
    saveStoredEndpoints(endpoints);

    // Save to history
    const history = getStoredHistory();
    if (!history[endpoint._id]) {
      history[endpoint._id] = [];
    }
    history[endpoint._id].unshift(newCheck);
    if (history[endpoint._id].length > 100) {
      history[endpoint._id] = history[endpoint._id].slice(0, 100);
    }
    saveStoredHistory(history);

    return newCheck;
  },

  async getEndpointHistory(id: string): Promise<{ checks: HealthCheck[]; total: number }> {
    try {
      const res = await axios.get(`/api/endpoints/${id}/history`, { timeout: 2000 });
      if (res.data?.success && res.data.data) {
        backendHealthy = true;
        return {
          checks: res.data.data,
          total: res.data.pagination?.total || res.data.data.length,
        };
      }
    } catch {
      backendHealthy = false;
    }

    const history = getStoredHistory();
    const checks = history[id] || [];
    return {
      checks,
      total: checks.length,
    };
  },

  resetDemoData() {
    localStorage.removeItem(LOCAL_STORAGE_ENDPOINTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
  },
};
