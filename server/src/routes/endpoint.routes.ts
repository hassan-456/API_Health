import { Router } from 'express';
import { endpointController } from '../controllers/endpoint.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  validateCreateEndpoint,
  validateUpdateEndpoint,
} from '../middleware/validateRequest';

const router = Router();

router.post('/', validateCreateEndpoint, asyncHandler(endpointController.create));
router.get('/', asyncHandler(endpointController.getAll));
router.get('/:id', asyncHandler(endpointController.getById));
router.put('/:id', validateUpdateEndpoint, asyncHandler(endpointController.update));
router.delete('/:id', asyncHandler(endpointController.delete));

export default router;
