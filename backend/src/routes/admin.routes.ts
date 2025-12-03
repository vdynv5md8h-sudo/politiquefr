import { Router } from 'express';
import { limiteurAdmin } from '../config/rateLimiter';
import { authentification, autoriserAdmin } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurAdmin from '../controleurs/admin.controleur';

const router = Router();

// Tous les endpoints admin nécessitent authentification + rôle admin
router.use(authentification);
router.use(autoriserAdmin);
router.use(limiteurAdmin);

// ===== MODÉRATION DES ACTUALITÉS =====

// GET /api/v1/admin/actualites - Toutes les actualités (y compris en attente)
router.get(
  '/actualites',
  asyncHandler(controleurAdmin.listerToutesActualites)
);

// PUT /api/v1/admin/actualites/:id/approuver - Approuver une actualité
router.put(
  '/actualites/:id/approuver',
  asyncHandler(controleurAdmin.approuverActualite)
);

// PUT /api/v1/admin/actualites/:id/rejeter - Rejeter une actualité
router.put(
  '/actualites/:id/rejeter',
  asyncHandler(controleurAdmin.rejeterActualite)
);

// DELETE /api/v1/admin/actualites/:id - Supprimer une actualité
router.delete(
  '/actualites/:id',
  asyncHandler(controleurAdmin.supprimerActualite)
);

// ===== SYNCHRONISATION DES DONNÉES =====

// GET /api/v1/admin/sync/statut - Statut des jobs de synchronisation
router.get(
  '/sync/statut',
  asyncHandler(controleurAdmin.statutSync)
);

// POST /api/v1/admin/sync/declencher - Déclencher une synchronisation manuellement
router.post(
  '/sync/declencher',
  asyncHandler(controleurAdmin.declencherSync)
);

// GET /api/v1/admin/sync/historique - Historique des synchronisations
router.get(
  '/sync/historique',
  asyncHandler(controleurAdmin.historiqueSync)
);

// ===== JOURNAUX D'AUDIT =====

// GET /api/v1/admin/audit - Journaux d'audit
router.get(
  '/audit',
  asyncHandler(controleurAdmin.journauxAudit)
);

// ===== STATISTIQUES DASHBOARD =====

// GET /api/v1/admin/stats - Statistiques du dashboard
router.get(
  '/stats',
  asyncHandler(controleurAdmin.statistiquesDashboard)
);

// ===== GESTION DES UTILISATEURS (ADMIN UNIQUEMENT) =====

// GET /api/v1/admin/utilisateurs - Liste des utilisateurs
router.get(
  '/utilisateurs',
  asyncHandler(controleurAdmin.listerUtilisateurs)
);

// POST /api/v1/admin/utilisateurs - Créer un utilisateur
router.post(
  '/utilisateurs',
  asyncHandler(controleurAdmin.creerUtilisateur)
);

// PUT /api/v1/admin/utilisateurs/:id - Modifier un utilisateur
router.put(
  '/utilisateurs/:id',
  asyncHandler(controleurAdmin.modifierUtilisateur)
);

// DELETE /api/v1/admin/utilisateurs/:id - Désactiver un utilisateur
router.delete(
  '/utilisateurs/:id',
  asyncHandler(controleurAdmin.desactiverUtilisateur)
);

export default router;
