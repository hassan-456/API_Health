import axios, { AxiosError } from 'axios';
import ApiEndpoint from '../models/ApiEndpoint';
import HealthCheck from '../models/HealthCheck';
import { IHealthCheck, AppError } from '../types';
import { isSuccessStatus } from '../utils/httpStatusHelper';

const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds

export class HealthCheckService {
  /**
   * Execute a health check for a given API endpoint.
   * Records the result (success or failure) in the database.
   */
  async executeCheck(apiId: string): Promise<IHealthCheck> {
    // 1. Find the API endpoint
    const endpoint = await ApiEndpoint.findById(apiId);
    if (!endpoint) {
      throw new AppError('API endpoint not found', 404);
    }

    // 2. Verify the API is active
    if (!endpoint.isActive) {
      throw new AppError('Cannot check an inactive API endpoint', 400);
    }

    const timestamp = new Date();
    let httpStatus: number | undefined;
    let responseTime: number | undefined;
    let success = false;
    let thresholdExceeded = false;
    let error: string | undefined;

    try {
      // 3. Record start time
      const startTime = performance.now();

      // 4. Execute the HTTP request
      const response = await axios({
        method: endpoint.method.toLowerCase() as any,
        url: endpoint.url,
        timeout: HEALTH_CHECK_TIMEOUT,
        validateStatus: () => true, // Accept all status codes
        maxRedirects: 5,
        headers: {
          'User-Agent': 'PulseWatch/1.0 Health Monitor',
        },
      });

      // 5. Calculate response time
      const endTime = performance.now();
      responseTime = Math.round(endTime - startTime);

      // 6. Capture HTTP status
      httpStatus = response.status;

      // 7. Determine success based on HTTP status
      success = isSuccessStatus(httpStatus);

      // 8. Determine if threshold was exceeded
      if (responseTime > endpoint.threshold) {
        thresholdExceeded = true;
      }

      // If status is not successful, capture error info
      if (!success) {
        error = `HTTP ${httpStatus} - ${response.statusText || 'Error'}`;
      }
    } catch (err) {
      // Handle network errors, timeouts, DNS failures, etc.
      success = false;
      thresholdExceeded = false;

      if (err instanceof AxiosError) {
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          error = 'Request timed out';
        } else if (err.code === 'ENOTFOUND') {
          error = 'DNS resolution failed';
        } else if (err.code === 'ECONNREFUSED') {
          error = 'Connection refused';
        } else if (err.code === 'ECONNRESET') {
          error = 'Connection reset';
        } else if (err.code === 'ERR_INVALID_URL') {
          error = 'Invalid URL';
        } else {
          error = err.message || 'Network error';
        }
      } else if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Unknown error occurred';
      }
    }

    // 9. Persist the health check result
    const healthCheck = await HealthCheck.create({
      apiId: endpoint._id,
      timestamp,
      httpStatus,
      responseTime,
      success,
      thresholdExceeded,
      error,
    });

    return healthCheck;
  }

  /**
   * Get health check history for a given API endpoint.
   */
  async getHistory(
    apiId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ checks: IHealthCheck[]; total: number }> {
    const endpoint = await ApiEndpoint.findById(apiId);
    if (!endpoint) {
      throw new AppError('API endpoint not found', 404);
    }

    const [checks, total] = await Promise.all([
      HealthCheck.find({ apiId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      HealthCheck.countDocuments({ apiId }),
    ]);

    return { checks: checks as IHealthCheck[], total };
  }

  /**
   * Get the latest health check for each API.
   */
  async getLatestChecks(): Promise<Map<string, IHealthCheck>> {
    const latestChecks = await HealthCheck.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$apiId',
          latestCheck: { $first: '$$ROOT' },
        },
      },
    ]);

    const checkMap = new Map<string, IHealthCheck>();
    for (const item of latestChecks) {
      checkMap.set(item._id.toString(), item.latestCheck);
    }

    return checkMap;
  }
}

export const healthCheckService = new HealthCheckService();
