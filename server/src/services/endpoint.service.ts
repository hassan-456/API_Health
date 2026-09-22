import ApiEndpoint from '../models/ApiEndpoint';
import HealthCheck from '../models/HealthCheck';
import Incident from '../models/Incident';
import { IApiEndpoint, IHealthCheck, CreateEndpointDto, UpdateEndpointDto, AppError } from '../types';

export class EndpointService {
  /**
   * Create a new API endpoint.
   */
  async create(data: CreateEndpointDto): Promise<IApiEndpoint> {
    const endpoint = await ApiEndpoint.create({
      name: data.name.trim(),
      url: data.url.trim(),
      method: data.method,
      threshold: data.threshold,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    return endpoint;
  }

  /**
   * Attach the newest health check so the dashboard can show status.
   */
  private async withLastChecks<T extends { _id: unknown }>(
    endpoints: T[]
  ): Promise<(T & { lastCheck?: IHealthCheck })[]> {
    if (endpoints.length === 0) return [];

    const latestChecks = await HealthCheck.aggregate([
      { $match: { apiId: { $in: endpoints.map((endpoint) => endpoint._id) } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$apiId',
          latestCheck: { $first: '$$ROOT' },
        },
      },
    ]);

    const checkByApi = new Map<string, IHealthCheck>(
      latestChecks.map((item) => [String(item._id), item.latestCheck as IHealthCheck])
    );

    return endpoints.map((endpoint) => ({
      ...endpoint,
      lastCheck: checkByApi.get(String(endpoint._id)),
    }));
  }

  /**
   * Get all API endpoints.
   */
  async getAll(): Promise<IApiEndpoint[]> {
    const endpoints = await ApiEndpoint.find().sort({ createdAt: -1 }).lean();
    return this.withLastChecks(endpoints);
  }

  /**
   * Get a single API endpoint by ID.
   */
  async getById(id: string): Promise<IApiEndpoint> {
    const endpoint = await ApiEndpoint.findById(id).lean();
    if (!endpoint) {
      throw new AppError('API endpoint not found', 404);
    }
    const [withCheck] = await this.withLastChecks([endpoint]);
    return withCheck;
  }

  /**
   * Update an API endpoint.
   */
  async update(id: string, data: UpdateEndpointDto): Promise<IApiEndpoint> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.url !== undefined) updateData.url = data.url.trim();
    if (data.method !== undefined) updateData.method = data.method;
    if (data.threshold !== undefined) updateData.threshold = data.threshold;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const endpoint = await ApiEndpoint.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!endpoint) {
      throw new AppError('API endpoint not found', 404);
    }

    return endpoint as IApiEndpoint;
  }

  /**
   * Delete an API endpoint and its health check history.
   */
  async delete(id: string): Promise<void> {
    const endpoint = await ApiEndpoint.findById(id);
    if (!endpoint) {
      throw new AppError('API endpoint not found', 404);
    }

    // Delete associated health checks and incident history
    await HealthCheck.deleteMany({ apiId: id });
    await Incident.deleteMany({ apiId: id });
    await ApiEndpoint.findByIdAndDelete(id);
  }
}

export const endpointService = new EndpointService();
