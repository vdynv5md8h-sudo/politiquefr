import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { reponseSucces } from '../utils/reponse';

// Données agrégées pour le dashboard
export async function getDashboard(_req: Request, res: Response): Promise<Response> {
  // Exécuter toutes les requêtes en parallèle pour optimiser les performances
  const [
    // Compteurs
    totalDeputes,
    totalSenateurs,
    totalMaires,
    // Groupes Assemblée avec leurs couleurs
    groupesAssembleeData,
    // Groupes Sénat avec leurs couleurs
    groupesSenatData,
    // Genre Assemblée
    genreAssembleeHommes,
    genreAssembleeFemmes,
    // Genre Sénat
    genreSenatHommes,
    genreSenatFemmes,
    // Scrutins récents
    scrutinsRecents,
    // Lois en cours
    loisEnCours,
  ] = await Promise.all([
    // Compteurs
    prisma.depute.count({ where: { mandatEnCours: true } }),
    prisma.senateur.count({ where: { mandatEnCours: true } }),
    prisma.maire.count(),

    // Groupes Assemblée
    prisma.depute.groupBy({
      by: ['groupeId'],
      _count: { id: true },
      where: { mandatEnCours: true },
    }),

    // Groupes Sénat
    prisma.senateur.groupBy({
      by: ['groupeId'],
      _count: { id: true },
      where: { mandatEnCours: true },
    }),

    // Genre Assemblée
    prisma.depute.count({ where: { mandatEnCours: true, civilite: 'M.' } }),
    prisma.depute.count({ where: { mandatEnCours: true, civilite: 'Mme' } }),

    // Genre Sénat
    prisma.senateur.count({ where: { mandatEnCours: true, civilite: 'M.' } }),
    prisma.senateur.count({ where: { mandatEnCours: true, civilite: 'Mme' } }),

    // Scrutins récents (5 derniers)
    prisma.scrutin.findMany({
      orderBy: { dateScrutin: 'desc' },
      take: 5,
      select: {
        id: true,
        titre: true,
        dateScrutin: true,
        resultat: true,
        chambre: true,
        pour: true,
        contre: true,
        abstention: true,
        loi: {
          select: {
            id: true,
            titre: true,
            titreCourt: true,
          },
        },
      },
    }),

    // Lois en cours (en séance ou en commission)
    prisma.loi.findMany({
      where: {
        statut: {
          in: ['EN_SEANCE', 'EN_COMMISSION', 'DEPOSE'],
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        titre: true,
        titreCourt: true,
        statut: true,
        type: true,
        dateDepot: true,
      },
    }),
  ]);

  // Récupérer les informations des groupes
  const tousGroupesIds = [
    ...groupesAssembleeData.map(g => g.groupeId).filter(Boolean) as string[],
    ...groupesSenatData.map(g => g.groupeId).filter(Boolean) as string[],
  ];

  const groupesInfo = await prisma.groupePolitique.findMany({
    where: { id: { in: tousGroupesIds } },
    select: { id: true, acronyme: true, nom: true, couleur: true, chambre: true },
  });

  // Formater les groupes Assemblée
  const groupesAssemblee = groupesAssembleeData
    .map(g => {
      const groupe = groupesInfo.find(gr => gr.id === g.groupeId);
      return {
        id: g.groupeId || 'non-inscrit',
        acronyme: groupe?.acronyme || 'NI',
        nom: groupe?.nom || 'Non-inscrits',
        couleur: groupe?.couleur || '#808080',
        nombre: g._count.id,
      };
    })
    .sort((a, b) => b.nombre - a.nombre);

  // Formater les groupes Sénat
  const groupesSenat = groupesSenatData
    .map(g => {
      const groupe = groupesInfo.find(gr => gr.id === g.groupeId);
      return {
        id: g.groupeId || 'non-inscrit',
        acronyme: groupe?.acronyme || 'NI',
        nom: groupe?.nom || 'Non-inscrits',
        couleur: groupe?.couleur || '#808080',
        nombre: g._count.id,
      };
    })
    .sort((a, b) => b.nombre - a.nombre);

  return reponseSucces(res, {
    compteurs: {
      deputes: totalDeputes,
      senateurs: totalSenateurs,
      maires: totalMaires,
    },
    groupesAssemblee,
    groupesSenat,
    genreAssemblee: {
      hommes: genreAssembleeHommes,
      femmes: genreAssembleeFemmes,
    },
    genreSenat: {
      hommes: genreSenatHommes,
      femmes: genreSenatFemmes,
    },
    scrutinsRecents,
    loisEnCours,
  });
}
