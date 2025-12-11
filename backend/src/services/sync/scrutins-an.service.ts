/**
 * Service de synchronisation des scrutins depuis data.assemblee-nationale.fr
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { ResultatScrutin, PositionVote, Chambre } from '@prisma/client';

// ==================== TYPES ====================

interface ScrutinAN {
  uid: string;
  numero: string;
  organeRef: string;
  legislature: string;
  sessionRef?: string;
  seanceRef?: string;
  dateScrutin: string;
  titre: string;
  objet?: {
    libelle?: string;
  };
  sort: {
    code: string; // adopté, rejeté
  };
  syntheseVote: {
    nombreVotants: string;
    suffragesExprimes: string;
    nbrSuffragesRequis: string;
    pour: { nombreMembresGroupe: string };
    contre: { nombreMembresGroupe: string };
    abstention?: { nombreMembresGroupe: string };
    nonVotant?: { nombreMembresGroupe: string };
  };
  ventilationVotes?: {
    organe?: {
      organeRef: string;
      groupes?: {
        groupe?: VoteGroupeAN | VoteGroupeAN[];
      };
    };
  };
  miseAuPoint?: unknown;
}

interface VoteGroupeAN {
  organeRef: string;
  vote: {
    decompteVoix: {
      pour?: string;
      contre?: string;
      abstention?: string;
      nonVotant?: string;
    };
    decompteNominatif?: {
      pour?: VotantAN[];
      contre?: VotantAN[];
      abstention?: VotantAN[];
      nonVotant?: VotantAN[];
    };
  };
}

interface VotantAN {
  acteurRef: string;
  parDelegation?: string; // "true" ou "false"
}

interface ResultatSync {
  traites: number;
  crees: number;
  misAJour: number;
  erreurs: number;
}

// ==================== HELPERS ====================

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function parseResultat(code: string): ResultatScrutin {
  const codeLower = code.toLowerCase();
  if (codeLower.includes('adopt') || codeLower === 'adopté') {
    return 'ADOPTE';
  }
  return 'REJETE';
}

// ==================== MAIN SYNC FUNCTION ====================

export async function synchroniserScrutinsAN(
  journalId: string,
  options: { legislature?: number; limite?: number } = {}
): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync scrutins AN...`);

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-scrutins-${Date.now()}`);
  const legislature = options.legislature || 17;

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // URL pour les scrutins
    const zipUrl = `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/vp/scrutins/Scrutins.json.zip`;

    logInfo(`[${journalId}] Téléchargement des scrutins...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 180000,
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'scrutins.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Chercher les fichiers JSON
    const scrutinsDir = path.join(tempDir, 'json', 'scrutin');
    let scrutinFiles: string[] = [];

    if (fs.existsSync(scrutinsDir)) {
      scrutinFiles = fs.readdirSync(scrutinsDir).filter(f => f.endsWith('.json'));
    } else {
      // Structure alternative - fichier unique
      const jsonFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.json'));
      for (const jf of jsonFiles) {
        try {
          const content = fs.readFileSync(path.join(tempDir, jf), 'utf-8');
          const data = JSON.parse(content);
          if (data.scrutins || data.scrutin) {
            scrutinFiles.push(jf);
            break;
          }
        } catch {
          // Ignorer
        }
      }
    }

    logInfo(`[${journalId}] ${scrutinFiles.length} fichiers scrutins trouvés`);

    for (const file of scrutinFiles) {
      try {
        const filePath = fs.existsSync(scrutinsDir)
          ? path.join(scrutinsDir, file)
          : path.join(tempDir, file);

        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        // Structure peut varier
        let scrutins: ScrutinAN[] = [];
        if (data.scrutin) {
          scrutins = [data.scrutin];
        } else if (data.scrutins?.scrutin) {
          scrutins = Array.isArray(data.scrutins.scrutin)
            ? data.scrutins.scrutin
            : [data.scrutins.scrutin];
        }

        for (const scrutin of scrutins) {
          try {
            if (!scrutin?.uid) continue;
            traites++;

            const synthese = scrutin.syntheseVote;
            const nombreVotants = parseInt(synthese.nombreVotants || '0') || 0;
            const suffrages = parseInt(synthese.suffragesExprimes || '0') || 0;
            const pour = parseInt(synthese.pour?.nombreMembresGroupe || '0') || 0;
            const contre = parseInt(synthese.contre?.nombreMembresGroupe || '0') || 0;
            const abstention = parseInt(synthese.abstention?.nombreMembresGroupe || '0') || 0;

            const scrutinData = {
              numeroScrutin: parseInt(scrutin.numero) || 0,
              chambre: 'ASSEMBLEE' as Chambre,
              legislature,
              dateScrutin: parseDate(scrutin.dateScrutin) || new Date(),
              titre: scrutin.titre,
              objet: scrutin.objet?.libelle,
              nombreVotants,
              nombreSuffrages: suffrages,
              majoriteAbsolue: parseInt(synthese.nbrSuffragesRequis) || Math.floor(suffrages / 2) + 1,
              pour,
              contre,
              abstention,
              resultat: parseResultat(scrutin.sort.code),
              urlScrutin: `https://www.assemblee-nationale.fr/dyn/${legislature}/scrutins/${scrutin.uid}`,
            };

            // Upsert par uid
            const existing = await prisma.scrutin.findFirst({
              where: {
                numeroScrutin: scrutinData.numeroScrutin,
                chambre: 'ASSEMBLEE',
                legislature,
              }
            });

            let scrutinId: string;

            if (existing) {
              await prisma.scrutin.update({
                where: { id: existing.id },
                data: scrutinData,
              });
              scrutinId = existing.id;
              misAJour++;
            } else {
              const created = await prisma.scrutin.create({
                data: scrutinData,
              });
              scrutinId = created.id;
              crees++;
            }

            // Traiter les votes individuels si disponibles
            if (scrutin.ventilationVotes?.organe?.groupes?.groupe) {
              const groupes = Array.isArray(scrutin.ventilationVotes.organe.groupes.groupe)
                ? scrutin.ventilationVotes.organe.groupes.groupe
                : [scrutin.ventilationVotes.organe.groupes.groupe];

              for (const groupe of groupes) {
                const decompteNom = groupe.vote?.decompteNominatif;
                if (!decompteNom) continue;

                // Traiter chaque position
                const positions: Array<{ pos: PositionVote; votants: VotantAN[] }> = [
                  { pos: 'POUR', votants: decompteNom.pour || [] },
                  { pos: 'CONTRE', votants: decompteNom.contre || [] },
                  { pos: 'ABSTENTION', votants: decompteNom.abstention || [] },
                  { pos: 'NON_VOTANT', votants: decompteNom.nonVotant || [] },
                ];

                for (const { pos, votants } of positions) {
                  for (const votant of votants) {
                    try {
                      // Trouver le député par acteurUid
                      const depute = await prisma.depute.findFirst({
                        where: { acteurUid: votant.acteurRef }
                      });

                      if (depute) {
                        await prisma.voteDepute.upsert({
                          where: {
                            deputeId_scrutinId: {
                              deputeId: depute.id,
                              scrutinId,
                            }
                          },
                          update: {
                            position: pos,
                            parDelegation: votant.parDelegation === 'true',
                          },
                          create: {
                            deputeId: depute.id,
                            scrutinId,
                            position: pos,
                            parDelegation: votant.parDelegation === 'true',
                          }
                        });
                      }
                    } catch {
                      // Ignorer les erreurs de votes individuels
                    }
                  }
                }
              }
            }

            if (options.limite && (crees + misAJour) >= options.limite) {
              break;
            }

          } catch (e) {
            erreurs++;
            logError(`[${journalId}] Erreur traitement scrutin:`, e);
          }
        }

      } catch (e) {
        erreurs++;
        logError(`[${journalId}] Erreur lecture ${file}:`, e);
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync scrutins AN:`, e);
    throw e;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignorer
    }
  }

  logInfo(`[${journalId}] Sync scrutins terminée: ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);

  return { traites, crees, misAJour, erreurs };
}
