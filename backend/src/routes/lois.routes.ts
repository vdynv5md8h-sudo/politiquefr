import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurLois from '../controleurs/lois.controleur';

const router = Router();

// GET /api/v1/lois - Liste des lois avec pagination et filtres
router.get(
  '/',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.listerLois)
);

// GET /api/v1/lois/recherche - Recherche de lois
router.get(
  '/recherche',
  middlewareCache(300),
  asyncHandler(controleurLois.rechercherLois)
);

// GET /api/v1/lois/recentes - Lois récentes (30 derniers jours)
router.get(
  '/recentes',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.loisRecentes)
);

// GET /api/v1/lois/themes - Liste des thèmes
router.get(
  '/themes',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.listeThemes)
);

// GET /api/v1/lois/par-theme/:themeId - Lois par thème
router.get(
  '/par-theme/:themeId',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.loisParTheme)
);

// GET /api/v1/lois/:id - Détail d'une loi
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.detailLoi)
);

// GET /api/v1/lois/:id/votes - Votes sur une loi
router.get(
  '/:id/votes',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.votesLoi)
);

// GET /api/v1/lois/:id/timeline - Timeline d'une loi
router.get(
  '/:id/timeline',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.timelineLoi)
);

// GET /api/v1/lois/:id/amendements - Amendements d'une loi
router.get(
  '/:id/amendements',
  middlewareCache(TTL_CACHE.LOIS),
  asyncHandler(controleurLois.amendementsLoi)
);

export default router;
