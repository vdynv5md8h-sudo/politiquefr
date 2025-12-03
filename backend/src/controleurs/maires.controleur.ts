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
const schemaFiltresMaires = z.object({
  page: z.string().optional(),
  limite: z.string().optional(),
  codeDepartement: z.string().optional(),
  codeRegion: z.string().optional(),
  codeNuance: z.string().optional(),
  tri: z.enum(['nom', 'libelleCommune', 'libelleDepartement']).optional(),
  ordre: z.enum(['asc', 'desc']).optional(),
});

// Lister les maires
export async function listerMaires(req: Request, res: Response): Promise<Response> {
  const filtres = schemaFiltresMaires.parse(req.query);
  const { page, limite, skip } = parserPagination(filtres);

  const where: Record<string, unknown> = {};
  if (filtres.codeDepartement) where.codeDepartement = filtres.codeDepartement;
  if (filtres.codeRegion) where.codeRegion = filtres.codeRegion;
  if (filtres.codeNuance) where.codeNuance = filtres.codeNuance;

  const orderBy: Record<string, string> = {};
  orderBy[filtres.tri || 'nom'] = filtres.ordre || 'asc';

  const [maires, total] = await Promise.all([
    prisma.maire.findMany({ where, orderBy, skip, take: limite }),
    prisma.maire.count({ where }),
  ]);

  return reponseSucces(res, maires, 200, calculerPagination(page, limite, total));
}

// Rechercher des maires
export async function rechercherMaires(req: Request, res: Response): Promise<Response> {
  const q = z.string().min(2).parse(req.query.q);
  const limite = Math.min(20, parseInt((req.query.limite as string) || '10', 10));

  const maires = await prisma.maire.findMany({
    where: {
      OR: [
        { nom: { contains: q } },
        { prenom: { contains: q } },
        { libelleCommune: { contains: q } },
      ],
    },
    take: limite,
  });

  return reponseSucces(res, maires);
}

// Statistiques
export async function statistiquesMaires(_req: Request, res: Response): Promise<Response> {
  const [total, parDepartement, parNuance] = await Promise.all([
    prisma.maire.count(),
    prisma.maire.groupBy({ by: ['codeDepartement'], _count: { id: true } }),
    prisma.maire.groupBy({ by: ['codeNuance'], _count: { id: true } }),
  ]);

  return reponseSucces(res, { total, parDepartement, parNuance });
}

// Maire par code commune
export async function maireParCommune(req: Request, res: Response): Promise<Response> {
  const maire = await prisma.maire.findFirst({
    where: { codeCommune: req.params.codeCommune },
    include: { promesses: true },
  });

  if (!maire) return reponseNonTrouve(res, 'Maire');
  return reponseSucces(res, maire);
}

// Maires par département
export async function mairesParDepartement(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const [maires, total] = await Promise.all([
    prisma.maire.findMany({
      where: { codeDepartement: req.params.codeDepartement },
      orderBy: { libelleCommune: 'asc' },
      skip,
      take: limite,
    }),
    prisma.maire.count({ where: { codeDepartement: req.params.codeDepartement } }),
  ]);

  return reponseSucces(res, maires, 200, calculerPagination(page, limite, total));
}

// Détail d'un maire
export async function detailMaire(req: Request, res: Response): Promise<Response> {
  const maire = await prisma.maire.findUnique({
    where: { id: req.params.id },
    include: { promesses: { orderBy: { createdAt: 'desc' } } },
  });

  if (!maire) return reponseNonTrouve(res, 'Maire');
  return reponseSucces(res, maire);
}

// Promesses d'un maire
export async function promessesMaire(req: Request, res: Response): Promise<Response> {
  const maire = await prisma.maire.findUnique({ where: { id: req.params.id } });
  if (!maire) return reponseNonTrouve(res, 'Maire');

  const promesses = await prisma.promesse.findMany({
    where: { maireId: maire.id },
    orderBy: { createdAt: 'desc' },
  });

  return reponseSucces(res, promesses);
}
