import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getDashboard(_req: Request, res: Response): Promise<void> {
    const data = await dashboardService.getDashboardData();
    res.json({ success: true, data });
  }
}

export const dashboardController = new DashboardController();
