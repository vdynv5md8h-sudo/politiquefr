/**
 * Routes API pour les commissions d'enquête
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
import { genererResumeCommission } from '../services/sync/resumes-llm.service';

const router = Router();

// Schéma de validation pour les filtres
const schemaFiltres = z.object({
  page: z.string().optional(),
  limite: z.string().optional(),
  chambre: z.enum(['ASSEMBLEE', 'SENAT']).optional(),
  statut: z.string().optional(),
  legislature: z.string().optional(),
});

// GET /api/v1/commissions-enquete - Liste avec filtres et pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const filtres = schemaFiltres.parse(req.query);
    const { page, limite, skip } = parserPagination(filtres);

    const where: Record<string, unknown> = {};

    if (filtres.chambre) {
      where.chambre = filtres.chambre;
    }

    if (filtres.statut) {
      where.statut = filtres.statut;
    }

    if (filtres.legislature) {
      where.legislature = parseInt(filtres.legislature);
    }

    const [commissions, total] = await Promise.all([
      prisma.commissionEnquete.findMany({
        where,
        orderBy: { dateCreation: 'desc' },
        skip,
        take: limite,
        include: {
          resumes: {
            where: { typeResume: 'COURT' },
            take: 1,
          },
        },
      }),
      prisma.commissionEnquete.count({ where }),
    ]);

    const pagination = calculerPagination(page, limite, total);
    return reponseSucces(res, commissions, 200, pagination);
  } catch (error) {
    console.error('Erreur liste commissions:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/commissions-enquete/en-cours - Commissions en cours
router.get('/en-cours', async (_req: Request, res: Response) => {
  try {
    const commissions = await prisma.commissionEnquete.findMany({
      where: {
        statut: 'EN_COURS',
      },
      orderBy: { dateCreation: 'desc' },
      include: {
        resumes: {
          where: { typeResume: 'COURT' },
          take: 1,
        },
      },
    });

    return reponseSucces(res, commissions);
  } catch (error) {
    console.error('Erreur commissions en cours:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/commissions-enquete/stats - Statistiques
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      total,
      enCours,
      terminees,
      parChambre,
      parLegislature,
    ] = await Promise.all([
      prisma.commissionEnquete.count(),
      prisma.commissionEnquete.count({ where: { statut: 'EN_COURS' } }),
      prisma.commissionEnquete.count({ where: { statut: { not: 'EN_COURS' } } }),
      prisma.commissionEnquete.groupBy({
        by: ['chambre'],
        _count: { id: true },
      }),
      prisma.commissionEnquete.groupBy({
        by: ['legislature'],
        _count: { id: true },
      }),
    ]);

    return reponseSucces(res, {
      total,
      enCours,
      terminees,
      parChambre: parChambre.map(c => ({ chambre: c.chambre, nombre: c._count.id })),
      parLegislature: parLegislature.map(l => ({ legislature: l.legislature, nombre: l._count.id })),
    });
  } catch (error) {
    console.error('Erreur stats commissions:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/commissions-enquete/:id - Détail d'une commission
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const commission = await prisma.commissionEnquete.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
      include: {
        resumes: true,
      },
    });

    if (!commission) {
      return reponseNonTrouve(res, 'Commission d\'enquête');
    }

    return reponseSucces(res, commission);
  } catch (error) {
    console.error('Erreur détail commission:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/commissions-enquete/:id/resume - Résumé LLM
router.get('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const typeResume = (req.query.type as string) || 'MOYEN';

    const commission = await prisma.commissionEnquete.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!commission) {
      return reponseNonTrouve(res, 'Commission d\'enquête');
    }

    // Chercher un résumé existant
    const resume = await prisma.resumeLLM.findFirst({
      where: {
        commissionEnqueteId: commission.id,
        typeResume: typeResume as 'COURT' | 'MOYEN' | 'LONG' | 'POINTS_CLES' | 'VULGARISE',
      },
    });

    if (resume) {
      return reponseSucces(res, resume);
    }

    return reponseSucces(res, {
      message: 'Aucun résumé disponible pour ce type',
      disponible: false,
    });
  } catch (error) {
    console.error('Erreur résumé commission:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// POST /api/v1/commissions-enquete/:id/resume - Régénérer résumé
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type: typeResume = 'MOYEN' } = req.body;

    const commission = await prisma.commissionEnquete.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!commission) {
      return reponseNonTrouve(res, 'Commission d\'enquête');
    }

    const resultat = await genererResumeCommission(commission.id, {
      typeResume: typeResume as 'COURT' | 'MOYEN' | 'LONG' | 'POINTS_CLES' | 'VULGARISE',
      forceRegenerate: true,
    });

    if (resultat) {
      return reponseSucces(res, {
        resume: resultat.resume,
        tokensUtilises: resultat.tokensEntree + resultat.tokensSortie,
      });
    }

    return res.status(422).json({
      succes: false,
      message: 'Impossible de générer le résumé (texte source insuffisant)',
    });
  } catch (error) {
    console.error('Erreur génération résumé commission:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

export default router;
