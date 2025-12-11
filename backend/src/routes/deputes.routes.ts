import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurDeputes from '../controleurs/deputes.controleur';

const router = Router();

// GET /api/v1/deputes - Liste des députés avec pagination et filtres
router.get(
  '/',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.listerDeputes)
);

// GET /api/v1/deputes/recherche - Recherche de députés
router.get(
  '/recherche',
  middlewareCache(300),
  asyncHandler(controleurDeputes.rechercherDeputes)
);

// GET /api/v1/deputes/stats - Statistiques sur les députés
router.get(
  '/stats',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.statistiquesDeputes)
);

// GET /api/v1/deputes/par-circonscription/:dept/:num - Député par circonscription
router.get(
  '/par-circonscription/:dept/:num',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.deputeParCirconscription)
);

// GET /api/v1/deputes/:id - Détail d'un député
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.detailDepute)
);

// GET /api/v1/deputes/:id/votes - Historique des votes d'un député
router.get(
  '/:id/votes',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.votesDepute)
);

// GET /api/v1/deputes/:id/activite - Statistiques d'activité d'un député
router.get(
  '/:id/activite',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.activiteDepute)
);

// GET /api/v1/deputes/:id/promesses - Promesses d'un député
router.get(
  '/:id/promesses',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.promessesDepute)
);

// GET /api/v1/deputes/:id/questions - Questions parlementaires d'un député
router.get(
  '/:id/questions',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurDeputes.questionsDepute)
);

export default router;
