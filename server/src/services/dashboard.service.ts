import ApiEndpoint from '../models/ApiEndpoint';
import HealthCheck from '../models/HealthCheck';
import { DashboardData, IHealthCheck } from '../types';
import { incidentService } from './incident.service';

export class DashboardService {
  /**
   * Get aggregated dashboard data including:
   * - API counts (total, active, inactive, healthy, slow, failed)
   * - Average response time
   * - Recent health checks
   */
  async getDashboardData(): Promise<DashboardData> {
    // Get all endpoints
    const endpoints = await ApiEndpoint.find().lean();

    const totalApis = endpoints.length;
    const activeApis = endpoints.filter((e) => e.isActive).length;
    const inactiveApis = totalApis - activeApis;

    // Get latest check for each active API
    const activeEndpointIds = endpoints
      .filter((e) => e.isActive)
      .map((e) => e._id);

    let healthyApis = 0;
    let slowApis = 0;
    let failedApis = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    if (activeEndpointIds.length > 0) {
      // Get latest health check for each active endpoint
      const latestChecks = await HealthCheck.aggregate([
        { $match: { apiId: { $in: activeEndpointIds } } },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$apiId',
            latestCheck: { $first: '$$ROOT' },
          },
        },
      ]);

      for (const item of latestChecks) {
        const check = item.latestCheck;
        if (!check.success) {
          failedApis++;
        } else if (check.thresholdExceeded) {
          slowApis++;
        } else {
          healthyApis++;
        }

        if (check.responseTime !== undefined && check.responseTime !== null) {
          totalResponseTime += check.responseTime;
          responseTimeCount++;
        }
      }

      // APIs with no checks yet are counted as neither healthy, slow, nor failed
      // They remain uncategorized until their first check
    }

    // Average response time
    const avgResponseTime =
      responseTimeCount > 0
        ? Math.round(totalResponseTime / responseTimeCount)
        : 0;

    // Recent checks (last 20)
    const recentChecks = await HealthCheck.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('apiId', 'name url method threshold')
      .lean();

    // Incident summary
    const [openIncidents, recentIncidents] = await Promise.all([
      incidentService.countOpen(),
      incidentService.getRecent(5),
    ]);

    return {
      totalApis,
      activeApis,
      inactiveApis,
      healthyApis,
      slowApis,
      failedApis,
      avgResponseTime,
      recentChecks: recentChecks as IHealthCheck[],
      openIncidents,
      recentIncidents,
    };
  }
}

export const dashboardService = new DashboardService();
