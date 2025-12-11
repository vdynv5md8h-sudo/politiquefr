/**
 * Routes API pour les amendements
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import {
  reponseSucces,
  reponseNonTrouve,
  calculerPagination,
  parserPagination,
} from '../utils/reponse';

const router = Router();

// Schéma de validation pour les filtres
const schemaFiltres = z.object({
  page: z.string().optional(),
  limite: z.string().optional(),
  sort: z.string().optional(),
  legislature: z.string().optional(),
  travauxId: z.string().optional(),
  auteurRef: z.string().optional(),
  tri: z.enum(['dateDepot', 'numero', 'sort']).optional(),
  ordre: z.enum(['asc', 'desc']).optional(),
});

// GET /api/v1/amendements - Liste avec filtres et pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const filtres = schemaFiltres.parse(req.query);
    const { page, limite, skip } = parserPagination(filtres);

    const where: Record<string, unknown> = {};

    if (filtres.sort) {
      where.sort = filtres.sort;
    }

    if (filtres.legislature) {
      where.legislature = parseInt(filtres.legislature);
    }

    if (filtres.travauxId) {
      where.travauxId = filtres.travauxId;
    }

    if (filtres.auteurRef) {
      where.auteurs = {
        contains: filtres.auteurRef,
      };
    }

    const orderBy: Record<string, string> = {};
    const champTri = filtres.tri || 'dateDepot';
    const ordreTri = filtres.ordre || 'desc';
    orderBy[champTri] = ordreTri;

    const [amendements, total] = await Promise.all([
      prisma.amendement.findMany({
        where,
        orderBy,
        skip,
        take: limite,
        include: {
          travaux: {
            select: {
              id: true,
              titre: true,
              titreCourt: true,
            },
          },
        },
      }),
      prisma.amendement.count({ where }),
    ]);

    const pagination = calculerPagination(page, limite, total);
    return reponseSucces(res, amendements, 200, pagination);
  } catch (error) {
    console.error('Erreur liste amendements:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/amendements/recents - Derniers amendements déposés
router.get('/recents', async (_req: Request, res: Response) => {
  try {
    const amendements = await prisma.amendement.findMany({
      orderBy: { dateDepot: 'desc' },
      take: 20,
      include: {
        travaux: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    return reponseSucces(res, amendements);
  } catch (error) {
    console.error('Erreur amendements récents:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/amendements/stats - Statistiques
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      total,
      parSort,
      parLegislature,
    ] = await Promise.all([
      prisma.amendement.count(),
      prisma.amendement.groupBy({
        by: ['sort'],
        _count: { id: true },
      }),
      prisma.amendement.groupBy({
        by: ['legislature'],
        _count: { id: true },
      }),
    ]);

    return reponseSucces(res, {
      total,
      parSort: parSort.map(s => ({ sort: s.sort, nombre: s._count.id })),
      parLegislature: parLegislature.map(l => ({ legislature: l.legislature, nombre: l._count.id })),
    });
  } catch (error) {
    console.error('Erreur stats amendements:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/amendements/:id - Détail d'un amendement
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const amendement = await prisma.amendement.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
      include: {
        travaux: {
          select: {
            id: true,
            uid: true,
            titre: true,
            titreCourt: true,
            typeDocument: true,
            statutExamen: true,
          },
        },
        loi: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    if (!amendement) {
      return reponseNonTrouve(res, 'Amendement');
    }

    return reponseSucces(res, amendement);
  } catch (error) {
    console.error('Erreur détail amendement:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

export default router;
