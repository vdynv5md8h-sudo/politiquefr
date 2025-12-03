import { Router } from 'express';
import { limiteurAuth } from '../config/rateLimiter';
import { authentification } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurAuth from '../controleurs/auth.controleur';

const router = Router();

// POST /api/v1/auth/connexion - Connexion admin
router.post(
  '/connexion',
  limiteurAuth,
  asyncHandler(controleurAuth.connexion)
);

// POST /api/v1/auth/deconnexion - Déconnexion
router.post(
  '/deconnexion',
  authentification,
  asyncHandler(controleurAuth.deconnexion)
);

// GET /api/v1/auth/moi - Obtenir l'utilisateur courant
router.get(
  '/moi',
  authentification,
  asyncHandler(controleurAuth.utilisateurCourant)
);

// POST /api/v1/auth/rafraichir - Rafraîchir le token
router.post(
  '/rafraichir',
  authentification,
  asyncHandler(controleurAuth.rafraichirToken)
);

export default router;
