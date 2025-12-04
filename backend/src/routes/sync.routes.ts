/**
 * Routes de synchronisation des données
 * Accessible via une clé secrète (pour contourner l'absence de Shell sur Render Free)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/erreur.middleware';
import { reponseSucces } from '../utils/reponse';
import { prisma } from '../config/database';
import {
  synchroniserDeputes,
  synchroniserSenateurs,
  synchroniserMaires,
  executerSyncComplete,
} from '../services/sync.service';
import { logInfo } from '../utils/logger';

const router = Router();

// Clé secrète pour autoriser la synchronisation (définie via variable d'environnement)
const SYNC_SECRET = process.env.SYNC_SECRET || 'politiquefr-sync-2024';

// Middleware de vérification de la clé
function verifierCleSync(req: Request, res: Response, next: () => void): void {
  const cle = req.query.key || req.headers['x-sync-key'];

  if (cle !== SYNC_SECRET) {
    res.status(401).json({ erreur: 'Clé de synchronisation invalide' });
    return;
  }

  next();
}

// GET /api/v1/sync/status - Statut de la base de données
router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  const [deputes, senateurs, maires, groupes, dernierSync] = await Promise.all([
    prisma.depute.count({ where: { mandatEnCours: true } }),
    prisma.senateur.count({ where: { mandatEnCours: true } }),
    prisma.maire.count(),
    prisma.groupePolitique.count({ where: { actif: true } }),
    prisma.journalSync.findFirst({ orderBy: { debuteA: 'desc' } }),
  ]);

  return reponseSucces(res, {
    baseDeDonnees: {
      deputes,
      senateurs,
      maires,
      groupesPolitiques: groupes,
    },
    derniereSynchronisation: dernierSync,
  });
}));

// POST /api/v1/sync/deputes?key=xxx - Synchroniser les députés
router.post('/deputes', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync députés déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'deputes',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserDeputes(journal.id);

    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: resultat.traites,
        enregistrementsCrees: resultat.crees,
        enregistrementsMisAJour: resultat.misAJour,
        enregistrementsErreurs: resultat.erreurs,
      },
    });

    return reponseSucces(res, {
      message: 'Synchronisation des députés terminée',
      resultat,
    });
  } catch (err) {
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'ECHEC',
        termineA: new Date(),
        messageErreur: String(err),
      },
    });
    throw err;
  }
}));

// POST /api/v1/sync/senateurs?key=xxx - Synchroniser les sénateurs
router.post('/senateurs', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync sénateurs déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'senateurs',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserSenateurs(journal.id);

    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: resultat.traites,
        enregistrementsCrees: resultat.crees,
        enregistrementsMisAJour: resultat.misAJour,
        enregistrementsErreurs: resultat.erreurs,
      },
    });

    return reponseSucces(res, {
      message: 'Synchronisation des sénateurs terminée',
      resultat,
    });
  } catch (err) {
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'ECHEC',
        termineA: new Date(),
        messageErreur: String(err),
      },
    });
    throw err;
  }
}));

// POST /api/v1/sync/maires?key=xxx - Synchroniser les maires
router.post('/maires', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync maires déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'maires',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserMaires(journal.id);

    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: resultat.traites,
        enregistrementsCrees: resultat.crees,
        enregistrementsMisAJour: resultat.misAJour,
        enregistrementsErreurs: resultat.erreurs,
      },
    });

    return reponseSucces(res, {
      message: 'Synchronisation des maires terminée',
      resultat,
    });
  } catch (err) {
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'ECHEC',
        termineA: new Date(),
        messageErreur: String(err),
      },
    });
    throw err;
  }
}));

// POST /api/v1/sync/tout?key=xxx - Synchroniser toutes les données
router.post('/tout', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync complète déclenchée via API');

  const resultat = await executerSyncComplete();

  return reponseSucces(res, {
    message: 'Synchronisation complète terminée',
    resultat,
  });
}));

// POST /api/v1/sync/fix-deputes-mandat?key=xxx - Corriger mandatEnCours pour tous les députés
// Workaround: nosdeputes.fr n'a que les données de la 16e législature (terminée en juin 2024)
router.post('/fix-deputes-mandat', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Fix mandatEnCours pour tous les députés');

  const result = await prisma.depute.updateMany({
    data: { mandatEnCours: true },
  });

  // Mettre à jour les compteurs de membres pour chaque groupe
  const groupes = await prisma.groupePolitique.findMany({ where: { chambre: 'ASSEMBLEE' } });
  for (const groupe of groupes) {
    const count = await prisma.depute.count({ where: { groupeId: groupe.id, mandatEnCours: true } });
    await prisma.groupePolitique.update({ where: { id: groupe.id }, data: { nombreMembres: count } });
  }

  return reponseSucces(res, {
    message: 'Tous les députés sont maintenant marqués comme mandatEnCours=true',
    deputesMisAJour: result.count,
  });
}));

export default router;
