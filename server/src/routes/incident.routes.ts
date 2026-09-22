import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// GET /api/incidents?status=OPEN&type=SERVER_ERROR&apiId=...&limit=50
router.get('/', asyncHandler(incidentController.getAll));

export default router;
