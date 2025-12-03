import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  reponseSucces,
  reponseNonTrouve,
  calculerPagination,
  parserPagination,
} from '../utils/reponse';

export async function listerScrutins(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });
  const chambre = req.query.chambre as string | undefined;

  const where = chambre ? { chambre: chambre as 'ASSEMBLEE' | 'SENAT' } : {};

  const [scrutins, total] = await Promise.all([
    prisma.scrutin.findMany({
      where,
      orderBy: { dateScrutin: 'desc' },
      skip,
      take: limite,
      include: { loi: { select: { id: true, titre: true, titreCourt: true } } },
    }),
    prisma.scrutin.count({ where }),
  ]);

  return reponseSucces(res, scrutins, 200, calculerPagination(page, limite, total));
}

export async function scrutinsRecents(_req: Request, res: Response): Promise<Response> {
  const scrutins = await prisma.scrutin.findMany({
    orderBy: { dateScrutin: 'desc' },
    take: 20,
    include: { loi: { select: { id: true, titre: true, titreCourt: true } } },
  });

  return reponseSucces(res, scrutins);
}

export async function detailScrutin(req: Request, res: Response): Promise<Response> {
  const scrutin = await prisma.scrutin.findUnique({
    where: { id: req.params.id },
    include: { loi: true },
  });

  if (!scrutin) return reponseNonTrouve(res, 'Scrutin');
  return reponseSucces(res, scrutin);
}

export async function repartitionScrutin(req: Request, res: Response): Promise<Response> {
  const scrutin = await prisma.scrutin.findUnique({
    where: { id: req.params.id },
    select: { id: true, chambre: true },
  });

  if (!scrutin) return reponseNonTrouve(res, 'Scrutin');

  // Répartition par groupe politique
  if (scrutin.chambre === 'ASSEMBLEE') {
    const votes = await prisma.voteDepute.findMany({
      where: { scrutinId: scrutin.id },
      include: {
        depute: {
          select: {
            groupe: { select: { id: true, acronyme: true, nom: true, couleur: true } },
          },
        },
      },
    });

    // Agréger par groupe
    const parGroupe: Record<string, { acronyme: string; nom: string; couleur: string | null; pour: number; contre: number; abstention: number }> = {};

    for (const vote of votes) {
      const groupeId = vote.depute.groupe?.id || 'non-inscrit';
      if (!parGroupe[groupeId]) {
        parGroupe[groupeId] = {
          acronyme: vote.depute.groupe?.acronyme || 'NI',
          nom: vote.depute.groupe?.nom || 'Non-inscrits',
          couleur: vote.depute.groupe?.couleur || null,
          pour: 0,
          contre: 0,
          abstention: 0,
        };
      }

      if (vote.position === 'POUR') parGroupe[groupeId].pour++;
      else if (vote.position === 'CONTRE') parGroupe[groupeId].contre++;
      else if (vote.position === 'ABSTENTION') parGroupe[groupeId].abstention++;
    }

    return reponseSucces(res, Object.values(parGroupe));
  } else {
    const votes = await prisma.voteSenateur.findMany({
      where: { scrutinId: scrutin.id },
      include: {
        senateur: {
          select: {
            groupe: { select: { id: true, acronyme: true, nom: true, couleur: true } },
          },
        },
      },
    });

    const parGroupe: Record<string, { acronyme: string; nom: string; couleur: string | null; pour: number; contre: number; abstention: number }> = {};

    for (const vote of votes) {
      const groupeId = vote.senateur.groupe?.id || 'non-inscrit';
      if (!parGroupe[groupeId]) {
        parGroupe[groupeId] = {
          acronyme: vote.senateur.groupe?.acronyme || 'NI',
          nom: vote.senateur.groupe?.nom || 'Non-inscrits',
          couleur: vote.senateur.groupe?.couleur || null,
          pour: 0,
          contre: 0,
          abstention: 0,
        };
      }

      if (vote.position === 'POUR') parGroupe[groupeId].pour++;
      else if (vote.position === 'CONTRE') parGroupe[groupeId].contre++;
      else if (vote.position === 'ABSTENTION') parGroupe[groupeId].abstention++;
    }

    return reponseSucces(res, Object.values(parGroupe));
  }
}
