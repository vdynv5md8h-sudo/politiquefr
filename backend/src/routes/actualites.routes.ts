import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurActualites from '../controleurs/actualites.controleur';

const router = Router();

// GET /api/v1/actualites - Liste des actualités approuvées
router.get(
  '/',
  middlewareCache(TTL_CACHE.ACTUALITES),
  asyncHandler(controleurActualites.listerActualites)
);

// GET /api/v1/actualites/affaires-judiciaires - Liste des affaires judiciaires
router.get(
  '/affaires-judiciaires',
  middlewareCache(TTL_CACHE.ACTUALITES),
  asyncHandler(controleurActualites.listerAffairesJudiciaires)
);

// GET /api/v1/actualites/affaires-judiciaires/:id - Détail d'une affaire judiciaire
router.get(
  '/affaires-judiciaires/:id',
  middlewareCache(TTL_CACHE.ACTUALITES),
  asyncHandler(controleurActualites.detailAffaireJudiciaire)
);

// GET /api/v1/actualites/par-categorie/:categorie - Actualités par catégorie
router.get(
  '/par-categorie/:categorie',
  middlewareCache(TTL_CACHE.ACTUALITES),
  asyncHandler(controleurActualites.actualitesParCategorie)
);

// GET /api/v1/actualites/:id - Détail d'une actualité
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.ACTUALITES),
  asyncHandler(controleurActualites.detailActualite)
);

export default router;
