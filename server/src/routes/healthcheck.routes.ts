import { Router } from 'express';
import { healthCheckController } from '../controllers/healthcheck.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// POST /api/endpoints/:id/check - Execute health check
router.post('/:id/check', asyncHandler(healthCheckController.executeCheck));

// GET /api/endpoints/:id/history - Get check history
router.get('/:id/history', asyncHandler(healthCheckController.getHistory));

export default router;
