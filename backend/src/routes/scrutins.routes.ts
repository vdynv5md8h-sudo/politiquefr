import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurScrutins from '../controleurs/scrutins.controleur';

const router = Router();

// GET /api/v1/scrutins - Liste des scrutins avec pagination
router.get(
  '/',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurScrutins.listerScrutins)
);

// GET /api/v1/scrutins/recents - Scrutins récents
router.get(
  '/recents',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurScrutins.scrutinsRecents)
);

// GET /api/v1/scrutins/:id - Détail d'un scrutin
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurScrutins.detailScrutin)
);

// GET /api/v1/scrutins/:id/repartition - Répartition des votes par groupe
router.get(
  '/:id/repartition',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurScrutins.repartitionScrutin)
);

export default router;
