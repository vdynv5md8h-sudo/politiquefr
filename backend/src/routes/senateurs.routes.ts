import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurSenateurs from '../controleurs/senateurs.controleur';

const router = Router();

// GET /api/v1/senateurs - Liste des sénateurs avec pagination et filtres
router.get(
  '/',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.listerSenateurs)
);

// GET /api/v1/senateurs/recherche - Recherche de sénateurs
router.get(
  '/recherche',
  middlewareCache(300),
  asyncHandler(controleurSenateurs.rechercherSenateurs)
);

// GET /api/v1/senateurs/stats - Statistiques sur les sénateurs
router.get(
  '/stats',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.statistiquesSenateurs)
);

// GET /api/v1/senateurs/par-departement/:codeDepartement - Sénateurs d'un département
router.get(
  '/par-departement/:codeDepartement',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.senateursParDepartement)
);

// GET /api/v1/senateurs/:id - Détail d'un sénateur
router.get(
  '/:id',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.detailSenateur)
);

// GET /api/v1/senateurs/:id/votes - Historique des votes d'un sénateur
router.get(
  '/:id/votes',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.votesSenateur)
);

// GET /api/v1/senateurs/:id/activite - Activité d'un sénateur avec moyennes
router.get(
  '/:id/activite',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.activiteSenateur)
);

// GET /api/v1/senateurs/:id/promesses - Promesses d'un sénateur
router.get(
  '/:id/promesses',
  middlewareCache(TTL_CACHE.SENATEURS),
  asyncHandler(controleurSenateurs.promessesSenateur)
);

export default router;
