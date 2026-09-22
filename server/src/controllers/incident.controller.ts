import { Request, Response } from 'express';
import { incidentService } from '../services/incident.service';
import { IncidentStatus, IncidentType } from '../types';

const VALID_STATUSES: IncidentStatus[] = ['OPEN', 'RESOLVED'];
const VALID_TYPES: IncidentType[] = [
  'SERVICE_UNAVAILABLE',
  'SLOW_RESPONSE',
  'CLIENT_ERROR',
  'SERVER_ERROR',
];

export class IncidentController {
  async getAll(req: Request, res: Response): Promise<void> {
    const statusParam = (req.query.status as string | undefined)?.toUpperCase();
    const typeParam = (req.query.type as string | undefined)?.toUpperCase();
    const apiId = req.query.apiId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const status =
      statusParam && VALID_STATUSES.includes(statusParam as IncidentStatus)
        ? (statusParam as IncidentStatus)
        : undefined;
    const type =
      typeParam && VALID_TYPES.includes(typeParam as IncidentType)
        ? (typeParam as IncidentType)
        : undefined;

    const incidents = await incidentService.getAll({ status, type, apiId, limit });
    res.json({ success: true, data: incidents });
  }
}

export const incidentController = new IncidentController();
