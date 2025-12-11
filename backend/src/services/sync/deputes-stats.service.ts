/**
 * Service de calcul des statistiques d'activité des députés
 * Calcule les stats depuis les données synchronisées (Questions, Amendements, Votes)
 */

import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';

// ==================== TYPES ====================

interface ResultatSync {
  traites: number;
  misAJour: number;
  erreurs: number;
}

interface StatsOptions {
  deputeId?: string;
  legislature?: number;
}

interface StatsDepute {
  questionsEcrites: number;
  questionsOrales: number;
  amendementsProposes: number;
  amendementsAdoptes: number;
  participationScrutins: number | null;
}

// ==================== HELPERS ====================

/**
 * Calcule les statistiques de questions pour un député
 */
async function calculerStatsQuestions(
  deputeId: string,
  legislature?: number
): Promise<{ qe: number; qo: number }> {
  const whereBase = { deputeId };
  const where = legislature ? { ...whereBase, legislature } : whereBase;

  const [qe, qosd, qg] = await Promise.all([
    prisma.question.count({ where: { ...where, type: 'QE' } }),
    prisma.question.count({ where: { ...where, type: 'QOSD' } }),
    prisma.question.count({ where: { ...where, type: 'QG' } }),
  ]);

  return {
    qe,
    qo: qosd + qg, // Questions orales = QOSD + QG
  };
}

/**
 * Calcule les statistiques d'amendements pour un député
 * Les auteurs sont stockés en JSON dans le champ auteurs
 */
async function calculerStatsAmendements(
  acteurUid: string,
  legislature?: number
): Promise<{ proposes: number; adoptes: number }> {
  // Use PostgreSQL JSON operators for efficient searching
  // auteurs field contains JSON like: [{"acteurRef":"PA123",...}]
  try {
    const whereClause = legislature
      ? `WHERE legislature = ${legislature} AND auteurs IS NOT NULL AND auteurs LIKE '%"acteurRef":"${acteurUid}"%'`
      : `WHERE auteurs IS NOT NULL AND auteurs LIKE '%"acteurRef":"${acteurUid}"%'`;

    const proposes = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "Amendement" ${whereClause}`
    );

    const adoptes = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "Amendement" ${whereClause} AND sort = 'ADOPTE'`
    );

    return {
      proposes: Number(proposes[0]?.count || 0),
      adoptes: Number(adoptes[0]?.count || 0),
    };
  } catch (e) {
    logError(`Erreur calcul amendements pour ${acteurUid}:`, e);
    return { proposes: 0, adoptes: 0 };
  }
}

/**
 * Calcule le taux de participation aux scrutins
 */
async function calculerParticipationScrutins(
  deputeId: string,
  legislature?: number
): Promise<number | null> {
  try {
    // Count votes by this deputy
    const votesCount = await prisma.voteDepute.count({
      where: {
        deputeId,
        scrutin: legislature ? { legislature } : undefined,
      },
    });

    // Count total scrutins in the period
    const totalScrutins = await prisma.scrutin.count({
      where: legislature ? { legislature } : undefined,
    });

    if (totalScrutins === 0) return null;

    // Participation rate as percentage
    return Math.round((votesCount / totalScrutins) * 100 * 10) / 10;
  } catch (e) {
    logError(`Erreur calcul participation scrutins pour ${deputeId}:`, e);
    return null;
  }
}

/**
 * Calcule toutes les statistiques pour un député
 */
async function calculerStatsPourDepute(
  depute: { id: string; acteurUid: string | null; legislature: number },
  legislature?: number
): Promise<StatsDepute> {
  const leg = legislature || depute.legislature;

  const [questions, amendements, participation] = await Promise.all([
    calculerStatsQuestions(depute.id, leg),
    depute.acteurUid
      ? calculerStatsAmendements(depute.acteurUid, leg)
      : Promise.resolve({ proposes: 0, adoptes: 0 }),
    calculerParticipationScrutins(depute.id, leg),
  ]);

  return {
    questionsEcrites: questions.qe,
    questionsOrales: questions.qo,
    amendementsProposes: amendements.proposes,
    amendementsAdoptes: amendements.adoptes,
    participationScrutins: participation,
  };
}

// ==================== MAIN FUNCTION ====================

/**
 * Calcule et met à jour les statistiques d'activité pour tous les députés
 * ou un député spécifique
 */
export async function calculerStatistiquesDeputes(
  journalId: string,
  options: StatsOptions = {}
): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage calcul statistiques députés...`);

  let misAJour = 0;
  let erreurs = 0;

  try {
    // Get deputies to process
    const whereDepute = options.deputeId
      ? { id: options.deputeId }
      : { mandatEnCours: true };

    const deputes = await prisma.depute.findMany({
      where: whereDepute,
      select: {
        id: true,
        acteurUid: true,
        legislature: true,
        nom: true,
        prenom: true,
      },
    });

    logInfo(`[${journalId}] ${deputes.length} députés à traiter...`);

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < deputes.length; i += batchSize) {
      const batch = deputes.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (depute) => {
          try {
            const stats = await calculerStatsPourDepute(depute, options.legislature);

            await prisma.depute.update({
              where: { id: depute.id },
              data: {
                questionsEcrites: stats.questionsEcrites,
                questionsOrales: stats.questionsOrales,
                amendementsProposes: stats.amendementsProposes,
                amendementsAdoptes: stats.amendementsAdoptes,
                participationScrutins: stats.participationScrutins,
              },
            });

            misAJour++;
          } catch (e) {
            erreurs++;
            if (erreurs <= 10) {
              logError(`[${journalId}] Erreur stats ${depute.prenom} ${depute.nom}:`, e);
            }
          }
        })
      );

      // Log progress
      if ((i + batchSize) % 100 === 0 || i + batchSize >= deputes.length) {
        logInfo(
          `[${journalId}] Progression: ${Math.min(i + batchSize, deputes.length)}/${deputes.length} députés traités`
        );
      }
    }

    logInfo(
      `[${journalId}] Calcul stats terminé: ${misAJour} mis à jour, ${erreurs} erreurs`
    );

    return {
      traites: misAJour + erreurs,
      misAJour,
      erreurs,
    };
  } catch (e) {
    logError(`[${journalId}] Erreur calcul statistiques:`, e);
    throw e;
  }
}

/**
 * Récupère un résumé des statistiques moyennes de l'assemblée
 */
export async function getStatistiquesMoyennesAssemblee(
  legislature?: number
): Promise<{
  moyennes: {
    questionsEcrites: number;
    questionsOrales: number;
    amendementsProposes: number;
    amendementsAdoptes: number;
    participationScrutins: number | null;
  };
  totaux: {
    deputes: number;
    questions: number;
    amendements: number;
    scrutins: number;
  };
}> {
  const whereDepute = { mandatEnCours: true };
  const whereLeg = legislature ? { legislature } : {};

  const [moyennes, totalDeputes, totalQuestions, totalAmendements, totalScrutins] =
    await Promise.all([
      prisma.depute.aggregate({
        _avg: {
          questionsEcrites: true,
          questionsOrales: true,
          amendementsProposes: true,
          amendementsAdoptes: true,
          participationScrutins: true,
        },
        where: whereDepute,
      }),
      prisma.depute.count({ where: whereDepute }),
      prisma.question.count({ where: whereLeg }),
      prisma.amendement.count({ where: whereLeg }),
      prisma.scrutin.count({ where: whereLeg }),
    ]);

  return {
    moyennes: {
      questionsEcrites: Math.round((moyennes._avg.questionsEcrites || 0) * 10) / 10,
      questionsOrales: Math.round((moyennes._avg.questionsOrales || 0) * 10) / 10,
      amendementsProposes: Math.round((moyennes._avg.amendementsProposes || 0) * 10) / 10,
      amendementsAdoptes: Math.round((moyennes._avg.amendementsAdoptes || 0) * 10) / 10,
      participationScrutins: moyennes._avg.participationScrutins
        ? Math.round(moyennes._avg.participationScrutins * 10) / 10
        : null,
    },
    totaux: {
      deputes: totalDeputes,
      questions: totalQuestions,
      amendements: totalAmendements,
      scrutins: totalScrutins,
    },
  };
}
