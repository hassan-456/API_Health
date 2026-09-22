import { Request, Response } from 'express';
import { healthCheckService } from '../services/healthcheck.service';

export class HealthCheckController {
  async executeCheck(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const result = await healthCheckService.executeCheck(id);
    res.json({ success: true, data: result });
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { checks, total } = await healthCheckService.getHistory(
      id,
      limit,
      offset
    );

    res.json({
      success: true,
      data: checks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  }
}

export const healthCheckController = new HealthCheckController();
