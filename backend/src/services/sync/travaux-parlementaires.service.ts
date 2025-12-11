/**
 * Service de synchronisation des travaux parlementaires depuis data.assemblee-nationale.fr
 * Source: https://data.assemblee-nationale.fr/travaux-parlementaires/dossiers-legislatifs
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { TypeDocumentParlement, StatutExamenTravaux, Chambre } from '@prisma/client';

// ==================== TYPES ====================

interface DossierLegislatifAN {
  uid: string;
  legislature: string;
  titre: string;
  titreChemin?: string;
  sepiLegislature?: string;
  procedureParlementaire?: {
    libelle?: string;
  };
  actesLegislatifs?: {
    acteLegislatif?: ActeLegislatif | ActeLegislatif[];
  };
  initiateur?: {
    acteurs?: {
      acteur?: InitiateurActeur | InitiateurActeur[];
    };
    organes?: {
      organe?: string | string[];
    };
  };
  titrePrincipal?: {
    titrePrincipal?: string;
  };
}

interface ActeLegislatif {
  uid: string;
  codeActe: string;
  libelleActe?: string;
  dateActe?: string;
  texteAdopte?: {
    texte?: TexteAN;
  };
  texteAssocie?: {
    typeTexte?: string;
    refTexte?: string;
  };
  organeRef?: string;
}

interface TexteAN {
  uid: string;
  titre: string;
  titreCourt?: string;
  dateDepot?: string;
  urlDocument?: string;
  urlDossier?: string;
}

interface InitiateurActeur {
  acteurRef: string;
  mandatRef: string;
}

interface ResultatSync {
  traites: number;
  crees: number;
  misAJour: number;
  erreurs: number;
}

interface SyncOptions {
  legislature?: number;
  types?: TypeDocumentParlement[];
  limite?: number;
}

// ==================== HELPERS ====================

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function determinerTypeDocument(titre: string, procedure?: string): TypeDocumentParlement {
  const titreLower = titre.toLowerCase();
  const procLower = procedure?.toLowerCase() || '';

  if (titreLower.includes('projet de loi organique') || procLower.includes('loi organique')) {
    return 'PROJET_LOI_ORGANIQUE';
  }
  if (titreLower.includes('proposition de loi organique')) {
    return 'PROPOSITION_LOI_ORGANIQUE';
  }
  if (titreLower.includes('projet de loi de finances') || procLower.includes('finances')) {
    return 'PROJET_LOI_FINANCES';
  }
  if (titreLower.includes('projet de loi de règlement') || procLower.includes('règlement')) {
    return 'PROJET_LOI_REGLEMENT';
  }
  if (titreLower.includes('financement de la sécurité sociale') || procLower.includes('sécurité sociale')) {
    return 'PROJET_LOI_FINANCEMENT_SECU';
  }
  if (titreLower.includes('proposition de résolution')) {
    return 'PROPOSITION_RESOLUTION';
  }
  if (titreLower.includes('rapport d\'information') || titreLower.startsWith('rapport d\'information')) {
    return 'RAPPORT_INFORMATION';
  }
  if (titreLower.includes('rapport') && !titreLower.includes('information')) {
    return 'RAPPORT';
  }
  if (titreLower.includes('avis')) {
    return 'AVIS';
  }
  if (titreLower.includes('texte adopté')) {
    return 'TEXTE_ADOPTE';
  }
  if (titreLower.includes('projet de loi')) {
    return 'PROJET_LOI';
  }
  if (titreLower.includes('proposition de loi')) {
    return 'PROPOSITION_LOI';
  }

  // Par défaut
  return 'PROJET_LOI';
}

function determinerStatut(actes: ActeLegislatif[]): StatutExamenTravaux {
  if (!actes || actes.length === 0) return 'EN_ATTENTE';

  // Trier par date pour trouver le dernier acte
  const actesTriees = [...actes].sort((a, b) => {
    const dateA = parseDate(a.dateActe)?.getTime() || 0;
    const dateB = parseDate(b.dateActe)?.getTime() || 0;
    return dateB - dateA;
  });

  const dernierActe = actesTriees[0];
  const codeActe = dernierActe?.codeActe?.toLowerCase() || '';

  if (codeActe.includes('promulg')) return 'PROMULGUE';
  if (codeActe.includes('adopt') && codeActe.includes('def')) return 'ADOPTE';
  if (codeActe.includes('cmp')) return 'CMP';
  if (codeActe.includes('2lec')) return 'DEUXIEME_LECTURE';
  if (codeActe.includes('1lec') && codeActe.includes('senat')) return 'PREMIERE_LECTURE_SENAT';
  if (codeActe.includes('1lec')) return 'PREMIERE_LECTURE_AN';
  if (codeActe.includes('seance')) return 'EN_SEANCE';
  if (codeActe.includes('com')) return 'EN_COMMISSION';
  if (codeActe.includes('reje')) return 'REJETE';
  if (codeActe.includes('retire')) return 'RETIRE';

  return 'EN_ATTENTE';
}

function extraireAuteurs(initiateur: DossierLegislatifAN['initiateur']): string | null {
  if (!initiateur?.acteurs?.acteur) return null;

  const acteurs = Array.isArray(initiateur.acteurs.acteur)
    ? initiateur.acteurs.acteur
    : [initiateur.acteurs.acteur];

  return JSON.stringify(acteurs.map(a => a.acteurRef));
}

// ==================== MAIN SYNC FUNCTION ====================

export async function synchroniserTravauxParlementaires(
  journalId: string,
  options: SyncOptions = {}
): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync travaux parlementaires...`);

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-travaux-${Date.now()}`);
  const legislature = options.legislature || 17;

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // URL pour les dossiers législatifs
    const zipUrl = `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`;

    logInfo(`[${journalId}] Téléchargement des dossiers législatifs...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 180000, // 3 minutes
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'dossiers.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Chercher le fichier JSON principal
    const jsonFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.json'));
    if (jsonFiles.length === 0) {
      // Chercher dans un sous-dossier
      const subDirs = fs.readdirSync(tempDir).filter(f =>
        fs.statSync(path.join(tempDir, f)).isDirectory()
      );
      for (const dir of subDirs) {
        const subFiles = fs.readdirSync(path.join(tempDir, dir)).filter(f => f.endsWith('.json'));
        if (subFiles.length > 0) {
          jsonFiles.push(...subFiles.map(f => path.join(dir, f)));
        }
      }
    }

    logInfo(`[${journalId}] ${jsonFiles.length} fichiers JSON trouvés`);

    for (const jsonFile of jsonFiles) {
      try {
        const content = fs.readFileSync(path.join(tempDir, jsonFile), 'utf-8');
        const data = JSON.parse(content);

        // Structure peut être { export: { dossierParlementaire: {...} } }
        // ou directement { dossierParlementaire: {...} }
        const dossiers = data.export?.dossiersLegislatifs?.dossier ||
                         data.dossiersLegislatifs?.dossier ||
                         data.dossier ||
                         [];

        const dossiersArray = Array.isArray(dossiers) ? dossiers : [dossiers];

        for (const dossierWrapper of dossiersArray) {
          try {
            traites++;
            const dossier = dossierWrapper.dossierParlementaire || dossierWrapper;

            if (!dossier?.uid) continue;

            // Extraire les actes législatifs
            let actes: ActeLegislatif[] = [];
            if (dossier.actesLegislatifs?.acteLegislatif) {
              actes = Array.isArray(dossier.actesLegislatifs.acteLegislatif)
                ? dossier.actesLegislatifs.acteLegislatif
                : [dossier.actesLegislatifs.acteLegislatif];
            }

            // Trouver le premier texte déposé
            let dateDepot: Date | null = null;
            let urlDocument: string | null = null;
            let urlDossier: string | null = null;

            for (const acte of actes) {
              if (acte.texteAdopte?.texte) {
                const texte = acte.texteAdopte.texte;
                if (!dateDepot && texte.dateDepot) {
                  dateDepot = parseDate(texte.dateDepot);
                }
                if (!urlDocument && texte.urlDocument) {
                  urlDocument = texte.urlDocument;
                }
                if (!urlDossier && texte.urlDossier) {
                  urlDossier = texte.urlDossier;
                }
              }
              if (!dateDepot && acte.dateActe) {
                dateDepot = parseDate(acte.dateActe);
              }
            }

            const typeDocument = determinerTypeDocument(
              dossier.titre,
              dossier.procedureParlementaire?.libelle
            );

            // Filtrer par type si spécifié
            if (options.types && options.types.length > 0) {
              if (!options.types.includes(typeDocument)) continue;
            }

            const travauxData = {
              uid: dossier.uid,
              typeDocument,
              titre: dossier.titre || 'Sans titre',
              titreOfficiel: dossier.titrePrincipal?.titrePrincipal,
              titreCourt: dossier.titreChemin,
              legislature: parseInt(dossier.legislature) || legislature,
              dateDepot: dateDepot || new Date(),
              dateExamen: actes.length > 0 ? parseDate(actes[actes.length - 1].dateActe) : null,
              chambreOrigine: 'ASSEMBLEE' as Chambre,
              statutExamen: determinerStatut(actes),
              urlDocumentPdf: urlDocument,
              urlDossierAN: urlDossier || `https://www.assemblee-nationale.fr/dyn/dossiers/${dossier.uid}`,
              auteurs: extraireAuteurs(dossier.initiateur),
            };

            // Upsert
            const existing = await prisma.travauxParlementaire.findUnique({
              where: { uid: dossier.uid }
            });

            if (existing) {
              await prisma.travauxParlementaire.update({
                where: { uid: dossier.uid },
                data: travauxData,
              });
              misAJour++;
            } else {
              await prisma.travauxParlementaire.create({
                data: travauxData,
              });
              crees++;
            }

            // Limite optionnelle
            if (options.limite && (crees + misAJour) >= options.limite) {
              logInfo(`[${journalId}] Limite atteinte: ${options.limite}`);
              break;
            }

          } catch (e) {
            erreurs++;
            logError(`[${journalId}] Erreur traitement dossier:`, e);
          }
        }

      } catch (e) {
        erreurs++;
        logError(`[${journalId}] Erreur lecture ${jsonFile}:`, e);
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync travaux parlementaires:`, e);
    throw e;
  } finally {
    // Nettoyer
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignorer
    }
  }

  logInfo(`[${journalId}] Sync travaux terminée: ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);

  return { traites, crees, misAJour, erreurs };
}

/**
 * Synchronise uniquement les projets de loi
 */
export async function synchroniserProjetsLoi(journalId: string): Promise<ResultatSync> {
  return synchroniserTravauxParlementaires(journalId, {
    types: ['PROJET_LOI', 'PROJET_LOI_ORGANIQUE', 'PROJET_LOI_FINANCES', 'PROJET_LOI_REGLEMENT', 'PROJET_LOI_FINANCEMENT_SECU']
  });
}

/**
 * Synchronise uniquement les propositions de loi
 */
export async function synchroniserPropositionsLoi(journalId: string): Promise<ResultatSync> {
  return synchroniserTravauxParlementaires(journalId, {
    types: ['PROPOSITION_LOI', 'PROPOSITION_LOI_ORGANIQUE', 'PROPOSITION_RESOLUTION']
  });
}
