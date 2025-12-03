import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  reponseSucces,
  reponseNonTrouve,
  calculerPagination,
  parserPagination,
} from '../utils/reponse';

export async function listerActualites(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });

  const [actualites, total] = await Promise.all([
    prisma.articleActualite.findMany({
      where: { statut: 'APPROUVE' },
      orderBy: { datePublication: 'desc' },
      skip,
      take: limite,
    }),
    prisma.articleActualite.count({ where: { statut: 'APPROUVE' } }),
  ]);

  return reponseSucces(res, actualites, 200, calculerPagination(page, limite, total));
}

export async function actualitesParCategorie(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });
  const categorie = req.params.categorie.toUpperCase();

  const [actualites, total] = await Promise.all([
    prisma.articleActualite.findMany({
      where: { statut: 'APPROUVE', categorie: categorie as never },
      orderBy: { datePublication: 'desc' },
      skip,
      take: limite,
    }),
    prisma.articleActualite.count({ where: { statut: 'APPROUVE', categorie: categorie as never } }),
  ]);

  return reponseSucces(res, actualites, 200, calculerPagination(page, limite, total));
}

export async function detailActualite(req: Request, res: Response): Promise<Response> {
  const actualite = await prisma.articleActualite.findFirst({
    where: { id: req.params.id, statut: 'APPROUVE' },
  });

  if (!actualite) return reponseNonTrouve(res, 'Actualité');
  return reponseSucces(res, actualite);
}

export async function listerAffairesJudiciaires(req: Request, res: Response): Promise<Response> {
  const { page, limite, skip } = parserPagination(req.query as { page?: string; limite?: string });
  const statut = req.query.statut as string | undefined;

  const where = statut ? { statut: statut as never } : {};

  const [affaires, total] = await Promise.all([
    prisma.affaireJudiciaire.findMany({
      where,
      orderBy: { dateDebut: 'desc' },
      skip,
      take: limite,
    }),
    prisma.affaireJudiciaire.count({ where }),
  ]);

  return reponseSucces(res, affaires, 200, calculerPagination(page, limite, total));
}

export async function detailAffaireJudiciaire(req: Request, res: Response): Promise<Response> {
  const affaire = await prisma.affaireJudiciaire.findUnique({
    where: { id: req.params.id },
  });

  if (!affaire) return reponseNonTrouve(res, 'Affaire judiciaire');
  return reponseSucces(res, affaire);
}
