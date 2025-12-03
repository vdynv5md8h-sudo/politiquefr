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
  statut: z.string().optional(),
  type: z.string().optional(),
  themeId: z.string().optional(),
  dateDepuis: z.string().optional(),
  dateJusqua: z.string().optional(),
});

export async function listerLois(req: Request, res: Response): Promise<Response> {
  const filtres = schemaFiltres.parse(req.query);
  const { page, limite, skip } = parserPagination(filtres);

  const where: Record<string, unknown> = {};
  if (filtres.statut) where.statut = filtres.statut;
  if (filtres.type) where.type = filtres.type;
  if (filtres.themeId) where.themeId = filtres.themeId;
  if (filtres.dateDepuis || filtres.dateJusqua) {
    where.dateDepot = {};
    if (filtres.dateDepuis) (where.dateDepot as Record<string, Date>).gte = new Date(filtres.dateDepuis);
    if (filtres.dateJusqua) (where.dateDepot as Record<string, Date>).lte = new Date(filtres.dateJusqua);
  }

  const [lois, total] = await Promise.all([
    prisma.loi.findMany({
      where,
      orderBy: { dateDepot: 'desc' },
      skip,
      take: limite,
      include: { theme: true, _count: { select: { scrutins: true, amendements: true } } },
    }),
    prisma.loi.count({ where }),
  ]);

  return reponseSucces(res, lois, 200, calculerPagination(page, limite, total));
}

export async function rechercherLois(req: Request, res: Response): Promise<Response> {
  const q = z.string().min(2).parse(req.query.q);

  const lois = await prisma.loi.findMany({
    where: {
      OR: [
        { titre: { contains: q } },
        { titreOfficiel: { contains: q } },
        { resume: { contains: q } },
      ],
    },
    take: 20,
    include: { theme: true },
  });

  return reponseSucces(res, lois);
}

export async function loisRecentes(_req: Request, res: Response): Promise<Response> {
  const dateIlYa30Jours = new Date();
  dateIlYa30Jours.setDate(dateIlYa30Jours.getDate() - 30);

  const lois = await prisma.loi.findMany({
    where: { dateDepot: { gte: dateIlYa30Jours } },
    orderBy: { dateDepot: 'desc' },
    take: 50,
    include: { theme: true },
  });

  return reponseSucces(res, lois);
}

export async function listeThemes(_req: Request, res: Response): Promise<Response> {
  const themes = await prisma.themeLoi.findMany({
    orderBy: { nom: 'asc' },
    include: { _count: { select: { lois: true } } },
  });

  return reponseSucces(res, themes);
}

export async function loisParTheme(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const [lois, total] = await Promise.all([
    prisma.loi.findMany({
      where: { themeId: req.params.themeId },
      orderBy: { dateDepot: 'desc' },
      skip,
      take: limite,
    }),
    prisma.loi.count({ where: { themeId: req.params.themeId } }),
  ]);

  return reponseSucces(res, lois, 200, calculerPagination(page, limite, total));
}

export async function detailLoi(req: Request, res: Response): Promise<Response> {
  const loi = await prisma.loi.findFirst({
    where: { OR: [{ id: req.params.id }, { dossierId: req.params.id }] },
    include: {
      theme: true,
      scrutins: { orderBy: { dateScrutin: 'desc' } },
      _count: { select: { amendements: true } },
    },
  });

  if (!loi) return reponseNonTrouve(res, 'Loi');
  return reponseSucces(res, loi);
}

export async function votesLoi(req: Request, res: Response): Promise<Response> {
  const loi = await prisma.loi.findFirst({
    where: { OR: [{ id: req.params.id }, { dossierId: req.params.id }] },
  });

  if (!loi) return reponseNonTrouve(res, 'Loi');

  const scrutins = await prisma.scrutin.findMany({
    where: { loiId: loi.id },
    orderBy: { dateScrutin: 'desc' },
  });

  return reponseSucces(res, scrutins);
}

export async function timelineLoi(req: Request, res: Response): Promise<Response> {
  const loi = await prisma.loi.findFirst({
    where: { OR: [{ id: req.params.id }, { dossierId: req.params.id }] },
    select: {
      id: true,
      titre: true,
      dateDepot: true,
      dateAdoption: true,
      datePromulgation: true,
      statut: true,
      scrutins: {
        select: { id: true, dateScrutin: true, titre: true, resultat: true, chambre: true },
        orderBy: { dateScrutin: 'asc' },
      },
    },
  });

  if (!loi) return reponseNonTrouve(res, 'Loi');

  // Construire la timeline
  const evenements = [
    { date: loi.dateDepot, type: 'depot', titre: 'Dépôt du texte' },
    ...loi.scrutins.map((s) => ({
      date: s.dateScrutin,
      type: 'scrutin',
      titre: s.titre,
      resultat: s.resultat,
      chambre: s.chambre,
    })),
    ...(loi.dateAdoption ? [{ date: loi.dateAdoption, type: 'adoption', titre: 'Adoption définitive' }] : []),
    ...(loi.datePromulgation ? [{ date: loi.datePromulgation, type: 'promulgation', titre: 'Promulgation' }] : []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return reponseSucces(res, { loi: { id: loi.id, titre: loi.titre, statut: loi.statut }, evenements });
}

export async function amendementsLoi(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const loi = await prisma.loi.findFirst({
    where: { OR: [{ id: req.params.id }, { dossierId: req.params.id }] },
  });

  if (!loi) return reponseNonTrouve(res, 'Loi');

  const [amendements, total] = await Promise.all([
    prisma.amendement.findMany({
      where: { loiId: loi.id },
      orderBy: { dateDepot: 'desc' },
      skip,
      take: limite,
    }),
    prisma.amendement.count({ where: { loiId: loi.id } }),
  ]);

  return reponseSucces(res, amendements, 200, calculerPagination(page, limite, total));
}
