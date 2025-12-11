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
  libelleActe?: {
    nomCanonique?: string;
    libelleCourt?: string;
  } | string;
  dateActe?: string;
  texteAdopte?: {
    texte?: TexteAN;
  };
  texteAssocie?: {
    typeTexte?: string;
    refTexte?: string;
  } | string;
  organeRef?: string;
  actesLegislatifs?: {
    acteLegislatif?: ActeLegislatif | ActeLegislatif[];
  };
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

  // Also check the libelleActe for status hints (e.g., "Renvoyé à la commission")
  let libelleActe = '';
  if (dernierActe?.libelleActe) {
    if (typeof dernierActe.libelleActe === 'string') {
      libelleActe = dernierActe.libelleActe.toLowerCase();
    } else if (dernierActe.libelleActe.nomCanonique) {
      libelleActe = dernierActe.libelleActe.nomCanonique.toLowerCase();
    }
  }

  if (codeActe.includes('promulg')) return 'PROMULGUE';
  if (codeActe.includes('adopt') && codeActe.includes('def')) return 'ADOPTE';
  if (codeActe.includes('cmp')) return 'CMP';
  if (codeActe.includes('2lec')) return 'DEUXIEME_LECTURE';
  if (codeActe.includes('1lec') && codeActe.includes('senat')) return 'PREMIERE_LECTURE_SENAT';
  if (codeActe.includes('1lec')) return 'PREMIERE_LECTURE_AN';
  if (codeActe.includes('seance')) return 'EN_SEANCE';
  // Check for "renvoi" or "renvoyé" which means sent to commission
  if (codeActe.includes('renvoi') || codeActe.includes('renvoy') || libelleActe.includes('renvoy')) return 'EN_COMMISSION';
  if (codeActe.includes('com')) return 'EN_COMMISSION';
  if (codeActe.includes('reje')) return 'REJETE';
  if (codeActe.includes('retire')) return 'RETIRE';

  return 'EN_ATTENTE';
}

interface AuteurEnrichi {
  acteurRef: string;
  nom?: string;
  prenom?: string;
  groupeAcronyme?: string;
  groupeCouleur?: string;
}

async function extraireAuteursEnrichis(initiateur: DossierLegislatifAN['initiateur']): Promise<string | null> {
  if (!initiateur?.acteurs?.acteur) return null;

  const acteurs = Array.isArray(initiateur.acteurs.acteur)
    ? initiateur.acteurs.acteur
    : [initiateur.acteurs.acteur];

  const auteursEnrichis: AuteurEnrichi[] = [];

  for (const acteur of acteurs) {
    const auteurEnrichi: AuteurEnrichi = { acteurRef: acteur.acteurRef };

    // Try to find the deputy in our database
    try {
      const depute = await prisma.depute.findFirst({
        where: { acteurUid: acteur.acteurRef },
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

  return JSON.stringify(auteursEnrichis);
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

    // Chercher les fichiers JSON dans json/dossierParlementaire/
    const dossierParlementaireDir = path.join(tempDir, 'json', 'dossierParlementaire');
    let jsonFiles: string[] = [];

    if (fs.existsSync(dossierParlementaireDir)) {
      jsonFiles = fs.readdirSync(dossierParlementaireDir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join('json', 'dossierParlementaire', f));
    } else {
      // Fallback: chercher récursivement
      const findJsonFiles = (dir: string, baseDir: string): string[] => {
        const files: string[] = [];
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const relativePath = path.relative(baseDir, fullPath);
          if (fs.statSync(fullPath).isDirectory()) {
            files.push(...findJsonFiles(fullPath, baseDir));
          } else if (entry.endsWith('.json')) {
            files.push(relativePath);
          }
        }
        return files;
      };
      jsonFiles = findJsonFiles(tempDir, tempDir);
    }

    logInfo(`[${journalId}] ${jsonFiles.length} fichiers JSON trouvés`);

    for (const jsonFile of jsonFiles) {
      try {
        const content = fs.readFileSync(path.join(tempDir, jsonFile), 'utf-8');
        const data = JSON.parse(content);

        // Structure: chaque fichier contient { dossierParlementaire: {...} }
        const dossier = data.dossierParlementaire;

        if (!dossier?.uid) {
          logInfo(`[${journalId}] Fichier sans uid: ${jsonFile}`);
          continue;
        }

        // Extraire le titre depuis titreDossier.titre
        const titre = dossier.titreDossier?.titre || dossier.titre || 'Sans titre';
        const titreChemin = dossier.titreDossier?.titreChemin || dossier.titreChemin;

        // Extraire les actes législatifs (peuvent être imbriqués)
        let actes: ActeLegislatif[] = [];
        if (dossier.actesLegislatifs?.acteLegislatif) {
          const acteLegislatif = dossier.actesLegislatifs.acteLegislatif;
          actes = Array.isArray(acteLegislatif) ? acteLegislatif : [acteLegislatif];
        }

        // Trouver le premier texte déposé
        let dateDepot: Date | null = null;
        let urlDocument: string | null = null;
        let urlDossier: string | null = null;

        // Fonction pour parcourir les actes imbriqués
        const extraireDates = (acte: ActeLegislatif) => {
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
          // Parcourir les actes imbriqués
          if (acte.actesLegislatifs?.acteLegislatif) {
            const subActes = Array.isArray(acte.actesLegislatifs.acteLegislatif)
              ? acte.actesLegislatifs.acteLegislatif
              : [acte.actesLegislatifs.acteLegislatif];
            for (const subActe of subActes) {
              extraireDates(subActe as ActeLegislatif);
            }
          }
        };

        for (const acte of actes) {
          extraireDates(acte);
        }

        const typeDocument = determinerTypeDocument(
          titre,
          dossier.procedureParlementaire?.libelle
        );

        // Filtrer par type si spécifié
        if (options.types && options.types.length > 0) {
          if (!options.types.includes(typeDocument)) continue;
        }

        // Extract enriched author data (with name and group from DB)
        const auteursEnrichis = await extraireAuteursEnrichis(dossier.initiateur);

        const travauxData = {
          uid: dossier.uid,
          typeDocument,
          titre,
          titreOfficiel: dossier.titrePrincipal?.titrePrincipal,
          titreCourt: titreChemin,
          legislature: parseInt(dossier.legislature) || legislature,
          dateDepot: dateDepot || new Date(),
          dateExamen: actes.length > 0 ? parseDate(actes[actes.length - 1]?.dateActe) : null,
          chambreOrigine: 'ASSEMBLEE' as Chambre,
          statutExamen: determinerStatut(actes),
          urlDocumentPdf: urlDocument,
          urlDossierAN: titreChemin ? `https://www.assemblee-nationale.fr/dyn/${dossier.legislature}/dossiers/${titreChemin}` : `https://www.assemblee-nationale.fr/dyn/${dossier.legislature}/dossiers/${dossier.uid}`,
          auteurs: auteursEnrichis,
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
        logError(`[${journalId}] Erreur traitement dossier ${jsonFile}:`, e);
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
