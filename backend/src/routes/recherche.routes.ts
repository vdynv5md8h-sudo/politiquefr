import { Router } from 'express';
import { limiteurRecherche } from '../config/rateLimiter';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurRecherche from '../controleurs/recherche.controleur';

const router = Router();

// GET /api/v1/recherche - Recherche globale
router.get(
  '/',
  limiteurRecherche,
  middlewareCache(TTL_CACHE.RECHERCHE),
  asyncHandler(controleurRecherche.rechercheGlobale)
);

// GET /api/v1/recherche/autocomplete - Suggestions rapides
router.get(
  '/autocomplete',
  limiteurRecherche,
  middlewareCache(60), // 1 minute
  asyncHandler(controleurRecherche.autocomplete)
);

export default router;
