/**
 * Routes API pour les travaux parlementaires
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
import { genererResumeTravaux } from '../services/sync/resumes-llm.service';

const router = Router();

// Schéma de validation pour les filtres
const schemaFiltres = z.object({
  page: z.string().optional(),
  limite: z.string().optional(),
  type: z.string().optional(),
  statut: z.string().optional(),
  legislature: z.string().optional(),
  themeId: z.string().optional(),
  tri: z.enum(['dateDepot', 'titre', 'statutExamen']).optional(),
  ordre: z.enum(['asc', 'desc']).optional(),
});

// GET /api/v1/travaux-parlementaires - Liste avec filtres et pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const filtres = schemaFiltres.parse(req.query);
    const { page, limite, skip } = parserPagination(filtres);

    const where: Record<string, unknown> = {};

    if (filtres.type) {
      where.typeDocument = filtres.type;
    }

    if (filtres.statut) {
      where.statutExamen = filtres.statut;
    }

    if (filtres.legislature) {
      where.legislature = parseInt(filtres.legislature);
    }

    if (filtres.themeId) {
      where.themeId = filtres.themeId;
    }

    const orderBy: Record<string, string> = {};
    const champTri = filtres.tri || 'dateDepot';
    const ordreTri = filtres.ordre || 'desc';
    orderBy[champTri] = ordreTri;

    const [travaux, total] = await Promise.all([
      prisma.travauxParlementaire.findMany({
        where,
        orderBy,
        skip,
        take: limite,
        include: {
          theme: true,
          commission: {
            select: {
              id: true,
              nom: true,
              nomCourt: true,
            },
          },
          resumes: {
            where: { typeResume: 'COURT' },
            take: 1,
          },
        },
      }),
      prisma.travauxParlementaire.count({ where }),
    ]);

    const pagination = calculerPagination(page, limite, total);
    return reponseSucces(res, travaux, 200, pagination);
  } catch (error) {
    console.error('Erreur liste travaux:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/recents - Derniers travaux déposés
router.get('/recents', async (_req: Request, res: Response) => {
  try {
    const travaux = await prisma.travauxParlementaire.findMany({
      orderBy: { dateDepot: 'desc' },
      take: 10,
      include: {
        theme: true,
        resumes: {
          where: { typeResume: 'COURT' },
          take: 1,
        },
      },
    });

    return reponseSucces(res, travaux);
  } catch (error) {
    console.error('Erreur travaux récents:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/projets-loi - Projets de loi
router.get('/projets-loi', async (req: Request, res: Response) => {
  try {
    const filtres = schemaFiltres.parse(req.query);
    const { page, limite, skip } = parserPagination(filtres);

    const where = {
      typeDocument: {
        in: [
          'PROJET_LOI' as const,
          'PROJET_LOI_ORGANIQUE' as const,
          'PROJET_LOI_FINANCES' as const,
          'PROJET_LOI_REGLEMENT' as const,
          'PROJET_LOI_FINANCEMENT_SECU' as const,
        ],
      },
    };

    const [travaux, total] = await Promise.all([
      prisma.travauxParlementaire.findMany({
        where,
        orderBy: { dateDepot: 'desc' },
        skip,
        take: limite,
        include: {
          theme: true,
          resumes: {
            where: { typeResume: 'COURT' },
            take: 1,
          },
        },
      }),
      prisma.travauxParlementaire.count({ where }),
    ]);

    const pagination = calculerPagination(page, limite, total);
    return reponseSucces(res, travaux, 200, pagination);
  } catch (error) {
    console.error('Erreur projets de loi:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/propositions-loi - Propositions de loi
router.get('/propositions-loi', async (req: Request, res: Response) => {
  try {
    const filtres = schemaFiltres.parse(req.query);
    const { page, limite, skip } = parserPagination(filtres);

    const where = {
      typeDocument: {
        in: ['PROPOSITION_LOI' as const, 'PROPOSITION_LOI_ORGANIQUE' as const, 'PROPOSITION_RESOLUTION' as const],
      },
    };

    const [travaux, total] = await Promise.all([
      prisma.travauxParlementaire.findMany({
        where,
        orderBy: { dateDepot: 'desc' },
        skip,
        take: limite,
        include: {
          theme: true,
          resumes: {
            where: { typeResume: 'COURT' },
            take: 1,
          },
        },
      }),
      prisma.travauxParlementaire.count({ where }),
    ]);

    const pagination = calculerPagination(page, limite, total);
    return reponseSucces(res, travaux, 200, pagination);
  } catch (error) {
    console.error('Erreur propositions de loi:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/textes-adoptes - Textes adoptés/promulgués
router.get('/textes-adoptes', async (req: Request, res: Response) => {
  try {
    const filtres = schemaFiltres.parse(req.query);
    const { page, limite, skip } = parserPagination(filtres);

    const where = {
      statutExamen: {
        in: ['ADOPTE' as const, 'PROMULGUE' as const],
      },
    };

    const [travaux, total] = await Promise.all([
      prisma.travauxParlementaire.findMany({
        where,
        orderBy: { dateAdoption: 'desc' },
        skip,
        take: limite,
        include: {
          theme: true,
          resumes: {
            where: { typeResume: 'COURT' },
            take: 1,
          },
        },
      }),
      prisma.travauxParlementaire.count({ where }),
    ]);

    const pagination = calculerPagination(page, limite, total);
    return reponseSucces(res, travaux, 200, pagination);
  } catch (error) {
    console.error('Erreur textes adoptés:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/stats - Statistiques
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      total,
      parType,
      parStatut,
      parLegislature,
    ] = await Promise.all([
      prisma.travauxParlementaire.count(),
      prisma.travauxParlementaire.groupBy({
        by: ['typeDocument'],
        _count: { id: true },
      }),
      prisma.travauxParlementaire.groupBy({
        by: ['statutExamen'],
        _count: { id: true },
      }),
      prisma.travauxParlementaire.groupBy({
        by: ['legislature'],
        _count: { id: true },
      }),
    ]);

    return reponseSucces(res, {
      total,
      parType: parType.map(t => ({ type: t.typeDocument, nombre: t._count.id })),
      parStatut: parStatut.map(s => ({ statut: s.statutExamen, nombre: s._count.id })),
      parLegislature: parLegislature.map(l => ({ legislature: l.legislature, nombre: l._count.id })),
    });
  } catch (error) {
    console.error('Erreur stats travaux:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/:id - Détail d'un travail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const travaux = await prisma.travauxParlementaire.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
      include: {
        theme: true,
        commission: true,
        loi: true,
        resumes: true,
        indicateurs: true,
      },
    });

    if (!travaux) {
      return reponseNonTrouve(res, 'Travaux parlementaire');
    }

    return reponseSucces(res, travaux);
  } catch (error) {
    console.error('Erreur détail travaux:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/:id/resume - Résumé LLM
router.get('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const typeResume = (req.query.type as string) || 'MOYEN';

    const travaux = await prisma.travauxParlementaire.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!travaux) {
      return reponseNonTrouve(res, 'Travaux parlementaire');
    }

    // Chercher un résumé existant
    const resume = await prisma.resumeLLM.findFirst({
      where: {
        travauxId: travaux.id,
        typeResume: typeResume as 'COURT' | 'MOYEN' | 'LONG' | 'POINTS_CLES' | 'VULGARISE',
      },
    });

    if (resume) {
      return reponseSucces(res, resume);
    }

    // Si pas de résumé, retourner un message approprié
    return reponseSucces(res, {
      message: 'Aucun résumé disponible pour ce type',
      disponible: false,
    });
  } catch (error) {
    console.error('Erreur résumé travaux:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// POST /api/v1/travaux-parlementaires/:id/resume - Régénérer résumé
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type: typeResume = 'MOYEN' } = req.body;

    const travaux = await prisma.travauxParlementaire.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!travaux) {
      return reponseNonTrouve(res, 'Travaux parlementaire');
    }

    const resultat = await genererResumeTravaux(travaux.id, {
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
    console.error('Erreur génération résumé:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/:id/indicateurs - Indicateurs liés
router.get('/:id/indicateurs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const travaux = await prisma.travauxParlementaire.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
      include: {
        indicateurs: true,
        theme: {
          include: {
            indicateurs: true,
          },
        },
      },
    });

    if (!travaux) {
      return reponseNonTrouve(res, 'Travaux parlementaire');
    }

    // Combiner indicateurs directs et ceux du thème
    const indicateurs = [
      ...travaux.indicateurs,
      ...(travaux.theme?.indicateurs || []),
    ];

    return reponseSucces(res, indicateurs);
  } catch (error) {
    console.error('Erreur indicateurs travaux:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

// GET /api/v1/travaux-parlementaires/:id/timeline - Chronologie
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const travaux = await prisma.travauxParlementaire.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
      select: {
        id: true,
        uid: true,
        titre: true,
        dateDepot: true,
        dateExamen: true,
        dateAdoption: true,
        datePromulgation: true,
        statutExamen: true,
      },
    });

    if (!travaux) {
      return reponseNonTrouve(res, 'Travaux parlementaire');
    }

    // Construire la timeline
    const timeline = [
      {
        etape: 'Dépôt',
        date: travaux.dateDepot,
        statut: 'termine',
      },
    ];

    if (travaux.dateExamen) {
      timeline.push({
        etape: 'Examen en commission',
        date: travaux.dateExamen,
        statut: 'termine',
      });
    }

    if (travaux.dateAdoption) {
      timeline.push({
        etape: 'Adoption',
        date: travaux.dateAdoption,
        statut: 'termine',
      });
    }

    if (travaux.datePromulgation) {
      timeline.push({
        etape: 'Promulgation',
        date: travaux.datePromulgation,
        statut: 'termine',
      });
    }

    return reponseSucces(res, { travaux, timeline });
  } catch (error) {
    console.error('Erreur timeline travaux:', error);
    return res.status(500).json({ succes: false, message: 'Erreur serveur' });
  }
});

export default router;
