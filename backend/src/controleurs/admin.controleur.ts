import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import {
  reponseSucces,
  reponseNonTrouve,
  reponseCree,
  calculerPagination,
  parserPagination,
} from '../utils/reponse';
import { ErreurValidation, ErreurInterdit } from '../middleware/erreur.middleware';
import { invaliderCacheType } from '../middleware/cache.middleware';
import { logInfo } from '../utils/logger';

// ===== MODÉRATION DES ACTUALITÉS =====

export async function listerToutesActualites(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });
  const statut = req.query.statut as string | undefined;

  const where = statut ? { statut: statut as never } : {};

  const [actualites, total] = await Promise.all([
    prisma.articleActualite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limite,
    }),
    prisma.articleActualite.count({ where }),
  ]);

  return reponseSucces(res, actualites, 200, calculerPagination(page, limite, total));
}

export async function approuverActualite(req: Request, res: Response): Promise<Response> {
  const actualite = await prisma.articleActualite.update({
    where: { id: req.params.id },
    data: {
      statut: 'APPROUVE',
      modereePar: req.utilisateur?.userId,
      modereeA: new Date(),
    },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'APPROUVER_ACTUALITE',
      typeEntite: 'ArticleActualite',
      entiteId: actualite.id,
      adresseIp: req.ip,
    },
  });

  invaliderCacheType('ACTUALITES');
  return reponseSucces(res, actualite);
}

export async function rejeterActualite(req: Request, res: Response): Promise<Response> {
  const { note } = z.object({ note: z.string().optional() }).parse(req.body);

  const actualite = await prisma.articleActualite.update({
    where: { id: req.params.id },
    data: {
      statut: 'REJETE',
      modereePar: req.utilisateur?.userId,
      modereeA: new Date(),
      noteModeration: note,
    },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'REJETER_ACTUALITE',
      typeEntite: 'ArticleActualite',
      entiteId: actualite.id,
      details: note ? JSON.stringify({ note }) : undefined,
      adresseIp: req.ip,
    },
  });

  return reponseSucces(res, actualite);
}

export async function supprimerActualite(req: Request, res: Response): Promise<Response> {
  await prisma.articleActualite.delete({
    where: { id: req.params.id },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'SUPPRIMER_ACTUALITE',
      typeEntite: 'ArticleActualite',
      entiteId: req.params.id,
      adresseIp: req.ip,
    },
  });

  invaliderCacheType('ACTUALITES');
  return reponseSucces(res, { message: 'Actualité supprimée' });
}

// ===== SYNCHRONISATION =====

export async function statutSync(_req: Request, res: Response): Promise<Response> {
  const derniersSync = await prisma.journalSync.findMany({
    orderBy: { debuteA: 'desc' },
    take: 10,
  });

  const enCours = derniersSync.filter((s) => s.statut === 'EN_COURS');

  return reponseSucces(res, {
    syncEnCours: enCours.length > 0,
    derniersSync,
  });
}

export async function declencherSync(req: Request, res: Response): Promise<Response> {
  const { typeDonnees } = z.object({
    typeDonnees: z.enum(['maires', 'deputes', 'senateurs', 'lois', 'actualites', 'tout']),
  }).parse(req.body);

  // Vérifier qu'un sync n'est pas déjà en cours
  const syncEnCours = await prisma.journalSync.findFirst({
    where: { statut: 'EN_COURS' },
  });

  if (syncEnCours) {
    throw new ErreurValidation(['Une synchronisation est déjà en cours']);
  }

  // Créer une entrée de journal
  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees,
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'DECLENCHER_SYNC',
      typeEntite: 'JournalSync',
      entiteId: journal.id,
      details: JSON.stringify({ typeDonnees }),
      adresseIp: req.ip,
    },
  });

  logInfo('Synchronisation déclenchée manuellement', { typeDonnees, par: req.utilisateur?.email });

  // TODO: Déclencher réellement le job de synchronisation
  // Pour l'instant, simuler une complétion
  setTimeout(async () => {
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: 0,
      },
    });
  }, 1000);

  return reponseSucces(res, { message: 'Synchronisation déclenchée', journalId: journal.id });
}

export async function historiqueSync(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const [journaux, total] = await Promise.all([
    prisma.journalSync.findMany({
      orderBy: { debuteA: 'desc' },
      skip,
      take: limite,
    }),
    prisma.journalSync.count(),
  ]);

  return reponseSucces(res, journaux, 200, calculerPagination(page, limite, total));
}

// ===== JOURNAUX D'AUDIT =====

export async function journauxAudit(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const [journaux, total] = await Promise.all([
    prisma.journalAudit.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limite,
      include: {
        utilisateur: { select: { id: true, nom: true, email: true } },
      },
    }),
    prisma.journalAudit.count(),
  ]);

  return reponseSucces(res, journaux, 200, calculerPagination(page, limite, total));
}

// ===== STATISTIQUES DASHBOARD =====

export async function statistiquesDashboard(_req: Request, res: Response): Promise<Response> {
  const [
    totalMaires,
    totalDeputes,
    totalSenateurs,
    totalLois,
    actualitesEnAttente,
    derniersSync,
  ] = await Promise.all([
    prisma.maire.count(),
    prisma.depute.count({ where: { mandatEnCours: true } }),
    prisma.senateur.count({ where: { mandatEnCours: true } }),
    prisma.loi.count(),
    prisma.articleActualite.count({ where: { statut: 'EN_ATTENTE' } }),
    prisma.journalSync.findMany({ orderBy: { debuteA: 'desc' }, take: 5 }),
  ]);

  return reponseSucces(res, {
    elus: {
      maires: totalMaires,
      deputes: totalDeputes,
      senateurs: totalSenateurs,
    },
    lois: totalLois,
    moderation: {
      enAttente: actualitesEnAttente,
    },
    synchronisation: {
      derniers: derniersSync,
    },
  });
}

// ===== GESTION DES UTILISATEURS =====

export async function listerUtilisateurs(_req: Request, res: Response): Promise<Response> {
  const utilisateurs = await prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      role: true,
      actif: true,
      derniereConnexion: true,
      createdAt: true,
    },
    orderBy: { nom: 'asc' },
  });

  return reponseSucces(res, utilisateurs);
}

const schemaCreerUtilisateur = z.object({
  email: z.string().email(),
  nom: z.string().min(2),
  motDePasse: z.string().min(8),
  role: z.enum(['ADMIN', 'MODERATEUR']).default('MODERATEUR'),
});

export async function creerUtilisateur(req: Request, res: Response): Promise<Response> {
  const donnees = schemaCreerUtilisateur.parse(req.body);

  // Vérifier que l'email n'existe pas déjà
  const existant = await prisma.utilisateur.findUnique({
    where: { email: donnees.email },
  });

  if (existant) {
    throw new ErreurValidation(['Cet email est déjà utilisé']);
  }

  const motDePasseHash = await bcrypt.hash(donnees.motDePasse, 12);

  const utilisateur = await prisma.utilisateur.create({
    data: {
      email: donnees.email,
      nom: donnees.nom,
      motDePasseHash,
      role: donnees.role,
    },
    select: {
      id: true,
      email: true,
      nom: true,
      role: true,
      createdAt: true,
    },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'CREER_UTILISATEUR',
      typeEntite: 'Utilisateur',
      entiteId: utilisateur.id,
      adresseIp: req.ip,
    },
  });

  logInfo('Utilisateur créé', { email: utilisateur.email, par: req.utilisateur?.email });

  return reponseCree(res, utilisateur);
}

export async function modifierUtilisateur(req: Request, res: Response): Promise<Response> {
  const schema = z.object({
    nom: z.string().min(2).optional(),
    role: z.enum(['ADMIN', 'MODERATEUR']).optional(),
    motDePasse: z.string().min(8).optional(),
  });

  const donnees = schema.parse(req.body);
  const updateData: Record<string, unknown> = {};

  if (donnees.nom) updateData.nom = donnees.nom;
  if (donnees.role) updateData.role = donnees.role;
  if (donnees.motDePasse) {
    updateData.motDePasseHash = await bcrypt.hash(donnees.motDePasse, 12);
  }

  const utilisateur = await prisma.utilisateur.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      nom: true,
      role: true,
    },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'MODIFIER_UTILISATEUR',
      typeEntite: 'Utilisateur',
      entiteId: utilisateur.id,
      adresseIp: req.ip,
    },
  });

  return reponseSucces(res, utilisateur);
}

export async function desactiverUtilisateur(req: Request, res: Response): Promise<Response> {
  // Ne pas permettre de se désactiver soi-même
  if (req.params.id === req.utilisateur?.userId) {
    throw new ErreurInterdit('Vous ne pouvez pas vous désactiver vous-même');
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: req.params.id },
  });

  if (!utilisateur) {
    return reponseNonTrouve(res, 'Utilisateur');
  }

  await prisma.utilisateur.update({
    where: { id: req.params.id },
    data: { actif: false },
  });

  await prisma.journalAudit.create({
    data: {
      utilisateurId: req.utilisateur!.userId,
      action: 'DESACTIVER_UTILISATEUR',
      typeEntite: 'Utilisateur',
      entiteId: req.params.id,
      adresseIp: req.ip,
    },
  });

  logInfo('Utilisateur désactivé', { email: utilisateur.email, par: req.utilisateur?.email });

  return reponseSucces(res, { message: 'Utilisateur désactivé' });
}
