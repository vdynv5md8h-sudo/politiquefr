import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurDashboard from '../controleurs/dashboard.controleur';

const router = Router();

// GET /api/v1/dashboard - Données agrégées pour le dashboard
router.get(
  '/',
  middlewareCache(TTL_CACHE.DEPUTES), // Cache de 15 minutes
  asyncHandler(controleurDashboard.getDashboard)
);

export default router;
