import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurGroupes from '../controleurs/groupes.controleur';

const router = Router();

// GET /api/v1/groupes - Liste de tous les groupes politiques
router.get(
  '/',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.listerGroupes)
);

// GET /api/v1/groupes/assemblee - Groupes de l'Assemblée nationale
router.get(
  '/assemblee',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.groupesAssemblee)
);

// GET /api/v1/groupes/senat - Groupes du Sénat
router.get(
  '/senat',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.groupesSenat)
);

// GET /api/v1/groupes/composition - Composition complète (données pour graphiques)
router.get(
  '/composition',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.compositionGroupes)
);

// GET /api/v1/groupes/:id - Détail d'un groupe
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.detailGroupe)
);

// GET /api/v1/groupes/:id/membres - Membres d'un groupe
router.get(
  '/:id/membres',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.membresGroupe)
);

// GET /api/v1/groupes/:id/votes - Tendances de vote du groupe
router.get(
  '/:id/votes',
  middlewareCache(TTL_CACHE.GROUPES),
  asyncHandler(controleurGroupes.votesGroupe)
);

export default router;
