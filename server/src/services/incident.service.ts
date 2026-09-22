import Incident from '../models/Incident';
import { IApiEndpoint, IHealthCheck, IIncident, IncidentStatus, IncidentType } from '../types';
import { classifyIncident } from '../utils/incidentClassifier';

export interface IncidentFilters {
  status?: IncidentStatus;
  type?: IncidentType;
  apiId?: string;
  limit?: number;
}

export class IncidentService {
  /**
   * Inspect the outcome of a health check and update incident state for the
   * endpoint accordingly:
   *  - A problem is detected and no incident is currently open  -> open one.
   *  - A problem is detected and one is already open            -> refresh it
   *    (label/type may change, e.g. Slow Response -> Server Error).
   *  - The check is healthy and an incident is open              -> resolve it.
   */
  async recordFromCheck(
    endpoint: Pick<IApiEndpoint, '_id' | 'name'>,
    check: IHealthCheck
  ): Promise<void> {
    const classification = classifyIncident({
      success: check.success,
      httpStatus: check.httpStatus,
      thresholdExceeded: check.thresholdExceeded,
    });

    const openIncident = await Incident.findOne({
      apiId: endpoint._id,
      status: 'OPEN',
    });

    if (!classification) {
      if (openIncident) {
        openIncident.status = 'RESOLVED';
        openIncident.resolvedAt = check.timestamp;
        openIncident.lastSeenAt = check.timestamp;
        await openIncident.save();
      }
      return;
    }

    if (openIncident) {
      openIncident.type = classification.type;
      openIncident.label = classification.label;
      openIncident.httpStatus = check.httpStatus;
      openIncident.responseTime = check.responseTime;
      openIncident.error = check.error;
      openIncident.lastSeenAt = check.timestamp;
      openIncident.healthCheckId = check._id;
      await openIncident.save();
      return;
    }

    await Incident.create({
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
      healthCheckId: check._id,
    });
  }

  /**
   * List incidents (most recently detected first), optionally filtered.
   */
  async getAll(filters: IncidentFilters = {}): Promise<IIncident[]> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.apiId) query.apiId = filters.apiId;

    const incidents = await Incident.find(query)
      .sort({ detectedAt: -1 })
      .limit(filters.limit ?? 200)
      .lean();

    return incidents as IIncident[];
  }

  /**
   * Count currently open incidents (used for dashboard summary).
   */
  async countOpen(): Promise<number> {
    return Incident.countDocuments({ status: 'OPEN' });
  }

  /**
   * Most recently detected incidents, for dashboard "at a glance" widgets.
   */
  async getRecent(limit = 5): Promise<IIncident[]> {
    const incidents = await Incident.find()
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();
    return incidents as IIncident[];
  }
}

export const incidentService = new IncidentService();
