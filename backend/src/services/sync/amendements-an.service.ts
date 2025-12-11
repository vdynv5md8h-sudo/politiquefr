/**
 * Service de synchronisation des amendements depuis data.assemblee-nationale.fr
 * Source: https://data.assemblee-nationale.fr/travaux-parlementaires/amendements
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { SortAmendement, Chambre } from '@prisma/client';

// ==================== TYPES ====================

interface AmendementAN {
  uid: string;
  identifiant?: {
    legislature?: string;
    numeroOrdreDepot?: string;
    numeroLong?: string;
  };
  corps?: {
    contenuAuteur?: {
      exposeSommaire?: string;
      dispositif?: string;
    };
  };
  sort?: {
    sortEnSeance?: string;
    dateSort?: string;
  };
  signataires?: {
    auteur?: {
      acteurRef?: string;
      qualite?: string;
    };
    cosignataires?: {
      cosignataire?: CosignatairAN | CosignatairAN[];
    };
  };
  texteLegislatifRef?: string;
  cycleDeVie?: {
    dateDepot?: string;
    datePublication?: string;
    etatDesTraitements?: {
      etat?: {
        code?: string;
        libelle?: string;
      };
    };
  };
  pointeurFragmentTexte?: {
    division?: {
      type?: string;
      titre?: string;
    };
  };
}

interface CosignatairAN {
  acteurRef: string;
}

interface AuteurEnrichi {
  acteurRef: string;
  nom?: string;
  prenom?: string;
  groupeAcronyme?: string;
  groupeCouleur?: string;
}

interface ResultatSync {
  traites: number;
  crees: number;
  misAJour: number;
  erreurs: number;
}

interface SyncOptions {
  legislature?: number;
  limite?: number;
}

// ==================== HELPERS ====================

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function determinerSort(sortEnSeance?: string, etatCode?: string): SortAmendement {
  const sortLower = (sortEnSeance || '').toLowerCase();
  const etatLower = (etatCode || '').toLowerCase();

  if (sortLower.includes('adopté') || sortLower === 'adopte') return 'ADOPTE';
  if (sortLower.includes('rejeté') || sortLower === 'rejete') return 'REJETE';
  if (sortLower.includes('retiré') || sortLower === 'retire') return 'RETIRE';
  if (sortLower.includes('tombé') || sortLower === 'tombe') return 'TOMBE';
  if (sortLower.includes('irrecevable') || etatLower.includes('irrecevable')) return 'IRRECEVABLE';
  if (sortLower.includes('non soutenu') || sortLower === 'non_soutenu') return 'NON_SOUTENU';

  return 'EN_COURS';
}

async function enrichirAuteurs(
  auteur: AmendementAN['signataires'],
): Promise<string | null> {
  if (!auteur) return null;

  const auteursEnrichis: AuteurEnrichi[] = [];

  // Auteur principal
  if (auteur.auteur?.acteurRef) {
    const auteurEnrichi: AuteurEnrichi = { acteurRef: auteur.auteur.acteurRef };

    try {
      const depute = await prisma.depute.findFirst({
        where: { acteurUid: auteur.auteur.acteurRef },
        include: {
          groupe: {
            select: {
              acronyme: true,
              couleur: true,
            },
          },
        },
      });

      if (depute) {
        auteurEnrichi.nom = depute.nom;
        auteurEnrichi.prenom = depute.prenom;
        if (depute.groupe) {
          auteurEnrichi.groupeAcronyme = depute.groupe.acronyme;
          auteurEnrichi.groupeCouleur = depute.groupe.couleur || undefined;
        }
      }
    } catch {
      // If lookup fails, just use the acteurRef
    }

    auteursEnrichis.push(auteurEnrichi);
  }

  // Cosignataires
  if (auteur.cosignataires?.cosignataire) {
    const cosignataires = Array.isArray(auteur.cosignataires.cosignataire)
      ? auteur.cosignataires.cosignataire
      : [auteur.cosignataires.cosignataire];

    for (const cosig of cosignataires.slice(0, 10)) { // Limit to first 10 cosignataires
      const auteurEnrichi: AuteurEnrichi = { acteurRef: cosig.acteurRef };

      try {
        const depute = await prisma.depute.findFirst({
          where: { acteurUid: cosig.acteurRef },
          include: {
            groupe: {
              select: {
                acronyme: true,
                couleur: true,
              },
            },
          },
        });

        if (depute) {
          auteurEnrichi.nom = depute.nom;
          auteurEnrichi.prenom = depute.prenom;
          if (depute.groupe) {
            auteurEnrichi.groupeAcronyme = depute.groupe.acronyme;
            auteurEnrichi.groupeCouleur = depute.groupe.couleur || undefined;
          }
        }
      } catch {
        // Continue with just acteurRef
      }

      auteursEnrichis.push(auteurEnrichi);
    }
  }

  return auteursEnrichis.length > 0 ? JSON.stringify(auteursEnrichis) : null;
}

// ==================== MAIN SYNC FUNCTION ====================

export async function synchroniserAmendements(
  journalId: string,
  options: SyncOptions = {}
): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync amendements...`);

  let crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-amendements-${Date.now()}`);
  const legislature = options.legislature || 17;

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // URL pour les amendements
    const zipUrl = `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/loi/amendements_div_legis/Amendements.json.zip`;

    logInfo(`[${journalId}] Téléchargement des amendements de la ${legislature}e législature...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutes - large file
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'amendements.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Find JSON files
    const jsonDir = path.join(tempDir, 'json', 'amendement');
    let jsonFiles: string[] = [];

    if (fs.existsSync(jsonDir)) {
      jsonFiles = fs.readdirSync(jsonDir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(jsonDir, f));
    } else {
      // Fallback: search recursively
      const findJsonFiles = (dir: string): string[] => {
        const files: string[] = [];
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          if (fs.statSync(fullPath).isDirectory()) {
            files.push(...findJsonFiles(fullPath));
          } else if (entry.endsWith('.json')) {
            files.push(fullPath);
          }
        }
        return files;
      };
      jsonFiles = findJsonFiles(tempDir);
    }

    logInfo(`[${journalId}] ${jsonFiles.length} fichiers JSON trouvés`);

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < jsonFiles.length; i += batchSize) {
      const batch = jsonFiles.slice(i, i + batchSize);

      for (const jsonFile of batch) {
        try {
          const content = fs.readFileSync(jsonFile, 'utf-8');
          const data = JSON.parse(content);

          // Structure: each file contains { amendement: {...} }
          const amendement = data.amendement as AmendementAN;

          if (!amendement?.uid) {
            continue;
          }

          const numero = amendement.identifiant?.numeroOrdreDepot ||
                        amendement.identifiant?.numeroLong ||
                        amendement.uid;

          const dateDepot = parseDate(amendement.cycleDeVie?.dateDepot);
          if (!dateDepot) {
            continue; // Skip if no deposit date
          }

          const sort = determinerSort(
            amendement.sort?.sortEnSeance,
            amendement.cycleDeVie?.etatDesTraitements?.etat?.code
          );

          const auteurs = await enrichirAuteurs(amendement.signataires);

          // Try to find linked TravauxParlementaire
          let travauxId: string | null = null;
          if (amendement.texteLegislatifRef) {
            const travaux = await prisma.travauxParlementaire.findFirst({
              where: { uid: amendement.texteLegislatifRef },
              select: { id: true }
            });
            if (travaux) {
              travauxId = travaux.id;
            }
          }

          const amendementData = {
            uid: amendement.uid,
            numero,
            chambre: 'ASSEMBLEE' as Chambre,
            legislature,
            travauxId,
            texteLegislatifRef: amendement.texteLegislatifRef || null,
            dispositif: amendement.corps?.contenuAuteur?.dispositif || null,
            exposeSommaire: amendement.corps?.contenuAuteur?.exposeSommaire || null,
            auteurs,
            sort,
            dateDepot,
            dateDiscussion: parseDate(amendement.sort?.dateSort),
            urlAmendement: `https://www.assemblee-nationale.fr/dyn/${legislature}/amendements/${amendement.uid}`,
          };

          // Upsert
          const existing = await prisma.amendement.findUnique({
            where: { uid: amendement.uid }
          });

          if (existing) {
            await prisma.amendement.update({
              where: { uid: amendement.uid },
              data: amendementData,
            });
            misAJour++;
          } else {
            await prisma.amendement.create({
              data: amendementData,
            });
            crees++;
          }

          // Limit for testing
          if (options.limite && (crees + misAJour) >= options.limite) {
            logInfo(`[${journalId}] Limite atteinte: ${options.limite}`);
            break;
          }

        } catch (e) {
          erreurs++;
          if (erreurs <= 10) {
            logError(`[${journalId}] Erreur traitement amendement:`, e);
          }
        }
      }

      if (options.limite && (crees + misAJour) >= options.limite) {
        break;
      }

      // Log progress
      if ((i + batchSize) % 1000 === 0) {
        logInfo(`[${journalId}] Progression: ${i + batchSize} amendements traités...`);
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync amendements:`, e);
    throw e;
  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }

  logInfo(`[${journalId}] Sync amendements terminée: ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);

  return { traites: crees + misAJour, crees, misAJour, erreurs };
}
