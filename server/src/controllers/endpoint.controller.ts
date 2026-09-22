import { Request, Response } from 'express';
import { endpointService } from '../services/endpoint.service';

export class EndpointController {
  async create(req: Request, res: Response): Promise<void> {
    const endpoint = await endpointService.create(req.body);
    res.status(201).json({ success: true, data: endpoint });
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    const endpoints = await endpointService.getAll();
    res.json({ success: true, data: endpoints });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const endpoint = await endpointService.getById(req.params.id as string);
    res.json({ success: true, data: endpoint });
  }

  async update(req: Request, res: Response): Promise<void> {
    const endpoint = await endpointService.update(req.params.id as string, req.body);
    res.json({ success: true, data: endpoint });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await endpointService.delete(req.params.id as string);
    res.json({ success: true, message: 'API endpoint deleted' });
  }
}

export const endpointController = new EndpointController();
