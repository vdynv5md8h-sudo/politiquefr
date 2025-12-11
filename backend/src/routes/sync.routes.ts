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
  synchroniserLois,
  synchroniserQuestions,
  executerSyncComplete,
} from '../services/sync.service';
import {
  synchroniserDeputesAN,
  synchroniserTravauxParlementaires,
  synchroniserCommissionsEnquete,
  synchroniserScrutinsAN,
  genererResumes,
  synchroniserIndicateursInsee,
} from '../services/sync';
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

// POST /api/v1/sync/lois?key=xxx - Synchroniser les lois
router.post('/lois', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync lois déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'lois',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserLois(journal.id);

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
      message: 'Synchronisation des lois terminée',
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

// POST /api/v1/sync/questions?key=xxx - Synchroniser les questions parlementaires
router.post('/questions', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync questions déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'questions',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserQuestions(journal.id);

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
      message: 'Synchronisation des questions terminée',
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

// ==================== NOUVELLES ROUTES AN (Assemblée nationale) ====================

// POST /api/v1/sync/deputes-an?key=xxx - Synchroniser depuis data.assemblee-nationale.fr
router.post('/deputes-an', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync députés AN déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'deputes-an',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserDeputesAN(journal.id);

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
      message: 'Synchronisation des députés depuis AN terminée',
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

// POST /api/v1/sync/travaux-parlementaires?key=xxx - Synchroniser les travaux parlementaires
router.post('/travaux-parlementaires', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync travaux parlementaires déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'travaux-parlementaires',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserTravauxParlementaires(journal.id);

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
      message: 'Synchronisation des travaux parlementaires terminée',
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

// POST /api/v1/sync/commissions-enquete?key=xxx - Synchroniser les commissions d'enquête
router.post('/commissions-enquete', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync commissions d\'enquête déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'commissions-enquete',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserCommissionsEnquete(journal.id);

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
      message: 'Synchronisation des commissions d\'enquête terminée',
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

// POST /api/v1/sync/scrutins-an?key=xxx - Synchroniser les scrutins depuis AN
router.post('/scrutins-an', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync scrutins AN déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'scrutins-an',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserScrutinsAN(journal.id);

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
      message: 'Synchronisation des scrutins AN terminée',
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

// POST /api/v1/sync/resumes?key=xxx&limite=50 - Générer les résumés LLM
router.post('/resumes', verifierCleSync, asyncHandler(async (req: Request, res: Response) => {
  logInfo('Génération des résumés LLM déclenchée via API');

  const limite = parseInt(req.query.limite as string) || 50;
  const typeResume = (req.query.type as string) || 'MOYEN';

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'resumes-llm',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await genererResumes(journal.id, {
      limite,
      typeResume: typeResume as 'COURT' | 'MOYEN' | 'LONG' | 'POINTS_CLES' | 'VULGARISE',
    });

    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: resultat.traites,
        enregistrementsCrees: resultat.generes,
        enregistrementsErreurs: resultat.erreurs,
      },
    });

    return reponseSucces(res, {
      message: 'Génération des résumés terminée',
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

// POST /api/v1/sync/indicateurs?key=xxx - Synchroniser les indicateurs INSEE
router.post('/indicateurs', verifierCleSync, asyncHandler(async (_req: Request, res: Response) => {
  logInfo('Sync indicateurs INSEE déclenchée via API');

  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'indicateurs-insee',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const resultat = await synchroniserIndicateursInsee(journal.id);

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
      message: 'Synchronisation des indicateurs INSEE terminée',
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

export default router;
