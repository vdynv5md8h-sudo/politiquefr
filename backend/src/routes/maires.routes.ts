import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurMaires from '../controleurs/maires.controleur';

const router = Router();

// GET /api/v1/maires - Liste des maires avec pagination et filtres
router.get(
  '/',
  middlewareCache(TTL_CACHE.MAIRES),
  asyncHandler(controleurMaires.listerMaires)
);

// GET /api/v1/maires/recherche - Recherche de maires
router.get(
  '/recherche',
  middlewareCache(300), // 5 minutes
  asyncHandler(controleurMaires.rechercherMaires)
);

// GET /api/v1/maires/stats - Statistiques sur les maires
router.get(
  '/stats',
  middlewareCache(TTL_CACHE.MAIRES),
  asyncHandler(controleurMaires.statistiquesMaires)
);

// GET /api/v1/maires/par-commune/:codeCommune - Maire par code commune
router.get(
  '/par-commune/:codeCommune',
  middlewareCache(TTL_CACHE.MAIRES),
  asyncHandler(controleurMaires.maireParCommune)
);

// GET /api/v1/maires/par-departement/:codeDepartement - Maires d'un département
router.get(
  '/par-departement/:codeDepartement',
  middlewareCache(TTL_CACHE.MAIRES),
  asyncHandler(controleurMaires.mairesParDepartement)
);

// GET /api/v1/maires/:id - Détail d'un maire
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.MAIRES),
  asyncHandler(controleurMaires.detailMaire)
);

// GET /api/v1/maires/:id/promesses - Promesses d'un maire
router.get(
  '/:id/promesses',
  middlewareCache(TTL_CACHE.MAIRES),
  asyncHandler(controleurMaires.promessesMaire)
);

export default router;
