import ApiEndpoint from '../models/ApiEndpoint';
import HealthCheck from '../models/HealthCheck';
import { DashboardData, DashboardRecentCheck, LatencyTrendPoint } from '../types';
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

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [rawRecentChecks, openIncidents, recentIncidents, checksInWindow, successfulChecks, trendChecks] =
      await Promise.all([
        HealthCheck.find()
          .sort({ timestamp: -1 })
          .limit(20)
          .populate('apiId', 'name url method threshold')
          .lean(),
        incidentService.countOpen(),
        incidentService.getRecent(5),
        HealthCheck.countDocuments({ timestamp: { $gte: since } }),
        HealthCheck.countDocuments({ timestamp: { $gte: since }, success: true }),
        HealthCheck.find({ timestamp: { $gte: dayAgo } })
          .select('timestamp responseTime')
          .lean(),
      ]);

    const recentChecks: DashboardRecentCheck[] = rawRecentChecks.map((check) => {
      const api = check.apiId as unknown as {
        _id?: unknown;
        name?: string;
        url?: string;
        method?: DashboardRecentCheck['method'];
      } | string;
      const populated = typeof api === 'object' && api !== null;

      return {
        ...check,
        apiId: (populated ? api._id : api) as DashboardRecentCheck['apiId'],
        apiName: populated ? api.name || 'Unknown API' : 'Unknown API',
        method: populated ? api.method || 'GET' : 'GET',
        endpointUrl: populated ? api.url || '' : '',
      };
    });

    const thresholdValues = endpoints.map((endpoint) => endpoint.threshold).filter((value) => value > 0);
    const slaThreshold =
      thresholdValues.length > 0
        ? Math.round(thresholdValues.reduce((sum, value) => sum + value, 0) / thresholdValues.length)
        : 300;

    const uptimePercentage =
      checksInWindow === 0
        ? 100
        : Math.round((successfulChecks / checksInWindow) * 1000) / 10;

    return {
      totalApis,
      activeApis,
      inactiveApis,
      healthyApis,
      slowApis,
      failedApis,
      avgResponseTime,
      uptimePercentage,
      recentChecks,
      latencyTrend: buildLatencyTrend(trendChecks, slaThreshold),
      openIncidents,
      recentIncidents,
    };
  }
}

function buildLatencyTrend(
  checks: { timestamp?: Date; responseTime?: number }[],
  threshold: number
): LatencyTrendPoint[] {
  const points = checks
    .filter((check) => check.timestamp != null && check.responseTime != null)
    .map((check) => ({
      at: new Date(check.timestamp as Date).toISOString(),
      date: new Date(check.timestamp as Date),
      avgLatency: Math.round(check.responseTime as number),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const usedLabels = new Set<string>();

  return points.map((point) => {
    const hh = String(point.date.getHours()).padStart(2, '0');
    const mm = String(point.date.getMinutes()).padStart(2, '0');
    const ss = String(point.date.getSeconds()).padStart(2, '0');
    let time = `${hh}:${mm}`;
    if (usedLabels.has(time)) time = `${hh}:${mm}:${ss}`;
    usedLabels.add(time);

    return {
      time,
      at: point.at,
      avgLatency: point.avgLatency,
      threshold,
    };
  });
}

export const dashboardService = new DashboardService();
