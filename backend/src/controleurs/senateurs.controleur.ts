import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import {
  reponseSucces,
  reponseNonTrouve,
  calculerPagination,
  parserPagination,
} from '../utils/reponse';

const schemaFiltres = z.object({
  page: z.string().optional(),
  limite: z.string().optional(),
  groupeId: z.string().optional(),
  codeDepartement: z.string().optional(),
  mandatEnCours: z.enum(['true', 'false']).optional(),
  tri: z.enum(['nom', 'departement']).optional(),
  ordre: z.enum(['asc', 'desc']).optional(),
});

export async function listerSenateurs(req: Request, res: Response): Promise<Response> {
  const filtres = schemaFiltres.parse(req.query);
  const { page, limite, skip } = parserPagination(filtres);

  const where: Record<string, unknown> = {};
  if (filtres.groupeId) where.groupeId = filtres.groupeId;
  if (filtres.codeDepartement) where.codeDepartement = filtres.codeDepartement;
  if (filtres.mandatEnCours !== undefined) where.mandatEnCours = filtres.mandatEnCours === 'true';

  const [senateurs, total] = await Promise.all([
    prisma.senateur.findMany({
      where,
      orderBy: { [filtres.tri || 'nom']: filtres.ordre || 'asc' },
      skip,
      take: limite,
      include: { groupe: { select: { id: true, acronyme: true, nom: true, couleur: true } } },
    }),
    prisma.senateur.count({ where }),
  ]);

  return reponseSucces(res, senateurs, 200, calculerPagination(page, limite, total));
}

export async function rechercherSenateurs(req: Request, res: Response): Promise<Response> {
  const q = z.string().min(2).parse(req.query.q);
  const senateurs = await prisma.senateur.findMany({
    where: {
      OR: [
        { nom: { contains: q } },
        { prenom: { contains: q } },
        { departement: { contains: q } },
      ],
    },
    take: 10,
    include: { groupe: { select: { id: true, acronyme: true, nom: true, couleur: true } } },
  });

  return reponseSucces(res, senateurs);
}

export async function statistiquesSenateurs(_req: Request, res: Response): Promise<Response> {
  const [total, enCours, parGroupe] = await Promise.all([
    prisma.senateur.count(),
    prisma.senateur.count({ where: { mandatEnCours: true } }),
    prisma.senateur.groupBy({ by: ['groupeId'], _count: { id: true }, where: { mandatEnCours: true } }),
  ]);

  return reponseSucces(res, { total, enCours, parGroupe });
}

export async function senateursParDepartement(req: Request, res: Response): Promise<Response> {
  const senateurs = await prisma.senateur.findMany({
    where: { codeDepartement: req.params.codeDepartement, mandatEnCours: true },
    include: { groupe: true },
  });

  return reponseSucces(res, senateurs);
}

export async function detailSenateur(req: Request, res: Response): Promise<Response> {
  const senateur = await prisma.senateur.findFirst({
    where: { OR: [{ id: req.params.id }, { matricule: req.params.id }] },
    include: { groupe: true, promesses: { orderBy: { createdAt: 'desc' } } },
  });

  if (!senateur) return reponseNonTrouve(res, 'Sénateur');
  return reponseSucces(res, senateur);
}

export async function votesSenateur(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const senateur = await prisma.senateur.findFirst({
    where: { OR: [{ id: req.params.id }, { matricule: req.params.id }] },
  });

  if (!senateur) return reponseNonTrouve(res, 'Sénateur');

  const [votes, total] = await Promise.all([
    prisma.voteSenateur.findMany({
      where: { senateurId: senateur.id },
      orderBy: { scrutin: { dateScrutin: 'desc' } },
      skip,
      take: limite,
      include: { scrutin: { include: { loi: { select: { id: true, titre: true } } } } },
    }),
    prisma.voteSenateur.count({ where: { senateurId: senateur.id } }),
  ]);

  return reponseSucces(res, votes, 200, calculerPagination(page, limite, total));
}

export async function promessesSenateur(req: Request, res: Response): Promise<Response> {
  const senateur = await prisma.senateur.findFirst({
    where: { OR: [{ id: req.params.id }, { matricule: req.params.id }] },
  });

  if (!senateur) return reponseNonTrouve(res, 'Sénateur');

  const promesses = await prisma.promesse.findMany({
    where: { senateurId: senateur.id },
    orderBy: { createdAt: 'desc' },
  });

  return reponseSucces(res, promesses);
}
