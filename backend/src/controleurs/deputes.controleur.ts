import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import {
  reponseSucces,
  reponseNonTrouve,
  calculerPagination,
  parserPagination,
} from '../utils/reponse';

// Schémas de validation
const schemaFiltresDeputes = z.object({
  page: z.string().optional(),
  limite: z.string().optional(),
  groupeId: z.string().optional(),
  departement: z.string().optional(),
  codeDepartement: z.string().optional(),
  mandatEnCours: z.enum(['true', 'false']).optional(),
  tri: z.enum(['nom', 'departement', 'presenceHemicycle', 'participationScrutins']).optional(),
  ordre: z.enum(['asc', 'desc']).optional(),
});

const schemaRechercheDepute = z.object({
  q: z.string().min(2).max(100),
  limite: z.string().optional(),
});

// Lister les députés avec pagination et filtres
export async function listerDeputes(req: Request, res: Response): Promise<Response> {
  const filtres = schemaFiltresDeputes.parse(req.query);
  const { page, limite, skip } = parserPagination(filtres);

  // Construction des conditions de filtrage
  const where: Record<string, unknown> = {};

  if (filtres.groupeId) {
    where.groupeId = filtres.groupeId;
  }

  if (filtres.departement) {
    where.departement = { contains: filtres.departement };
  }

  if (filtres.codeDepartement) {
    where.codeDepartement = filtres.codeDepartement;
  }

  if (filtres.mandatEnCours !== undefined) {
    where.mandatEnCours = filtres.mandatEnCours === 'true';
  }

  // Tri
  const orderBy: Record<string, string> = {};
  const champTri = filtres.tri || 'nom';
  const ordreTri = filtres.ordre || 'asc';
  orderBy[champTri] = ordreTri;

  // Requête
  const [deputes, total] = await Promise.all([
    prisma.depute.findMany({
      where,
      orderBy,
      skip,
      take: limite,
      include: {
        groupe: {
          select: {
            id: true,
            acronyme: true,
            nom: true,
            couleur: true,
          },
        },
      },
    }),
    prisma.depute.count({ where }),
  ]);

  const pagination = calculerPagination(page, limite, total);

  return reponseSucces(res, deputes, 200, pagination);
}

// Rechercher des députés
export async function rechercherDeputes(req: Request, res: Response): Promise<Response> {
  const params = schemaRechercheDepute.parse(req.query);
  const limite = Math.min(20, parseInt(params.limite || '10', 10));

  const deputes = await prisma.depute.findMany({
    where: {
      OR: [
        { nom: { contains: params.q } },
        { prenom: { contains: params.q } },
        { departement: { contains: params.q } },
      ],
    },
    take: limite,
    include: {
      groupe: {
        select: {
          id: true,
          acronyme: true,
          nom: true,
          couleur: true,
        },
      },
    },
  });

  return reponseSucces(res, deputes);
}

// Statistiques sur les députés
export async function statistiquesDeputes(_req: Request, res: Response): Promise<Response> {
  const [
    totalDeputes,
    deputesEnCours,
    parGroupe,
    moyennePresence,
  ] = await Promise.all([
    prisma.depute.count(),
    prisma.depute.count({ where: { mandatEnCours: true } }),
    prisma.depute.groupBy({
      by: ['groupeId'],
      _count: { id: true },
      where: { mandatEnCours: true },
    }),
    prisma.depute.aggregate({
      _avg: {
        presenceHemicycle: true,
        presenceCommission: true,
        participationScrutins: true,
      },
      where: { mandatEnCours: true },
    }),
  ]);

  // Récupérer les noms des groupes
  const groupesIds = parGroupe.map((g) => g.groupeId).filter(Boolean) as string[];
  const groupes = await prisma.groupePolitique.findMany({
    where: { id: { in: groupesIds } },
    select: { id: true, acronyme: true, nom: true, couleur: true },
  });

  const repartitionParGroupe = parGroupe.map((g) => {
    const groupe = groupes.find((gr) => gr.id === g.groupeId);
    return {
      groupeId: g.groupeId,
      acronyme: groupe?.acronyme || 'Non-inscrits',
      nom: groupe?.nom || 'Non-inscrits',
      couleur: groupe?.couleur,
      nombre: g._count.id,
    };
  });

  return reponseSucces(res, {
    total: totalDeputes,
    enCours: deputesEnCours,
    repartitionParGroupe,
    moyennes: {
      presenceHemicycle: moyennePresence._avg.presenceHemicycle,
      presenceCommission: moyennePresence._avg.presenceCommission,
      participationScrutins: moyennePresence._avg.participationScrutins,
    },
  });
}

// Député par circonscription
export async function deputeParCirconscription(req: Request, res: Response): Promise<Response> {
  const { dept, num } = req.params;
  const numeroCirco = parseInt(num, 10);

  const depute = await prisma.depute.findFirst({
    where: {
      OR: [
        { codeDepartement: dept },
        { departement: { contains: dept } },
      ],
      numeroCirconscription: numeroCirco,
      mandatEnCours: true,
    },
    include: {
      groupe: true,
    },
  });

  if (!depute) {
    return reponseNonTrouve(res, 'Député non trouvé pour cette circonscription');
  }

  return reponseSucces(res, depute);
}

// Détail d'un député
export async function detailDepute(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  const depute = await prisma.depute.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
      ],
    },
    include: {
      groupe: true,
      promesses: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!depute) {
    return reponseNonTrouve(res, 'Député');
  }

  return reponseSucces(res, depute);
}

// Votes d'un député
export async function votesDepute(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  // Vérifier que le député existe
  const depute = await prisma.depute.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!depute) {
    return reponseNonTrouve(res, 'Député');
  }

  const [votes, total] = await Promise.all([
    prisma.voteDepute.findMany({
      where: { deputeId: depute.id },
      orderBy: { scrutin: { dateScrutin: 'desc' } },
      skip,
      take: limite,
      include: {
        scrutin: {
          include: {
            loi: {
              select: {
                id: true,
                titre: true,
                titreCourt: true,
              },
            },
          },
        },
      },
    }),
    prisma.voteDepute.count({ where: { deputeId: depute.id } }),
  ]);

  const pagination = calculerPagination(page, limite, total);

  // Statistiques de vote
  const statsVotes = await prisma.voteDepute.groupBy({
    by: ['position'],
    where: { deputeId: depute.id },
    _count: { id: true },
  });

  const statistiques = {
    pour: statsVotes.find((s) => s.position === 'POUR')?._count.id || 0,
    contre: statsVotes.find((s) => s.position === 'CONTRE')?._count.id || 0,
    abstention: statsVotes.find((s) => s.position === 'ABSTENTION')?._count.id || 0,
    nonVotant: statsVotes.find((s) => s.position === 'NON_VOTANT')?._count.id || 0,
    total,
  };

  return reponseSucces(res, { votes, statistiques }, 200, pagination);
}

// Activité d'un député
export async function activiteDepute(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  const depute = await prisma.depute.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      presenceCommission: true,
      presenceHemicycle: true,
      participationScrutins: true,
      questionsEcrites: true,
      questionsOrales: true,
      propositionsLoi: true,
      rapports: true,
      interventions: true,
      amendementsProposes: true,
      amendementsAdoptes: true,
    },
  });

  if (!depute) {
    return reponseNonTrouve(res, 'Député');
  }

  // Comparer avec la moyenne
  const moyennes = await prisma.depute.aggregate({
    _avg: {
      presenceCommission: true,
      presenceHemicycle: true,
      participationScrutins: true,
      questionsEcrites: true,
      questionsOrales: true,
      propositionsLoi: true,
      rapports: true,
      interventions: true,
    },
    where: { mandatEnCours: true },
  });

  return reponseSucces(res, {
    depute,
    moyennesAssemblee: moyennes._avg,
  });
}

// Promesses d'un député
export async function promessesDepute(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  const depute = await prisma.depute.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!depute) {
    return reponseNonTrouve(res, 'Député');
  }

  const promesses = await prisma.promesse.findMany({
    where: { deputeId: depute.id },
    orderBy: { createdAt: 'desc' },
  });

  // Statistiques des promesses
  const stats = await prisma.promesse.groupBy({
    by: ['statut'],
    where: { deputeId: depute.id },
    _count: { id: true },
  });

  const statistiques = {
    total: promesses.length,
    tenues: stats.find((s) => s.statut === 'TENUE')?._count.id || 0,
    partiellementTenues: stats.find((s) => s.statut === 'PARTIELLEMENT_TENUE')?._count.id || 0,
    enCours: stats.find((s) => s.statut === 'EN_COURS')?._count.id || 0,
    nonTenues: stats.find((s) => s.statut === 'NON_TENUE')?._count.id || 0,
    abandonnees: stats.find((s) => s.statut === 'ABANDONNEE')?._count.id || 0,
    nonEvaluees: stats.find((s) => s.statut === 'NON_EVALUEE')?._count.id || 0,
  };

  return reponseSucces(res, { promesses, statistiques });
}
