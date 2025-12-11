/**
 * Service de synchronisation des questions parlementaires depuis data.assemblee-nationale.fr
 * Source: https://data.assemblee-nationale.fr/travaux-parlementaires/questions
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { TypeQuestion } from '@prisma/client';

// ==================== TYPES ====================

interface QuestionAN {
  uid: string;
  identifiant?: {
    legislature?: string;
    numero?: string;
  };
  type?: string; // QE, QG, QOSD
  indexationAN?: {
    rubrique?: string;
    analyse?: string;
  };
  textesQuestion?: {
    texteQuestion?: TexteQuestion | TexteQuestion[];
  };
  textesReponse?: {
    texteReponse?: TexteReponse | TexteReponse[];
  };
  auteur?: {
    identite?: {
      acteurRef?: string;
    };
    groupe?: {
      organeRef?: string;
      acronyme?: string;
      nom?: string;
    };
  };
  minInt?: {
    organeInterroge?: string;
    abrege?: string;
    libelle?: string;
  };
  minAttribs?: {
    minAttrib?: MinAttrib | MinAttrib[];
  };
  dateDepot?: string;
  dateRetrait?: string;
  clopiAuteur?: string;
  clopiReponse?: string;
}

interface TexteQuestion {
  texte?: string;
  datePublication?: string;
}

interface TexteReponse {
  texte?: string;
  dateJOReponse?: string;
}

interface MinAttrib {
  minAttrib?: {
    organe?: string;
    abrege?: string;
    libelle?: string;
  };
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
  type?: 'QE' | 'QG' | 'QOSD' | 'ALL';
}

// ==================== HELPERS ====================

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function determinerTypeQuestion(type?: string, uid?: string): TypeQuestion {
  const typeLower = (type || '').toLowerCase();
  if (typeLower.includes('qe') || uid?.includes('QE')) return 'QE';
  if (typeLower.includes('qg') || uid?.includes('QG')) return 'QG';
  if (typeLower.includes('qosd') || uid?.includes('QOSD')) return 'QOSD';
  return 'QE'; // Default
}

function extractTexteQuestion(textesQuestion?: QuestionAN['textesQuestion']): string | null {
  if (!textesQuestion?.texteQuestion) return null;

  const textes = Array.isArray(textesQuestion.texteQuestion)
    ? textesQuestion.texteQuestion
    : [textesQuestion.texteQuestion];

  // Get the most recent one
  const texte = textes[textes.length - 1];
  return texte?.texte || null;
}

function extractTexteReponse(textesReponse?: QuestionAN['textesReponse']): { texte: string | null; date: Date | null } {
  if (!textesReponse?.texteReponse) return { texte: null, date: null };

  const textes = Array.isArray(textesReponse.texteReponse)
    ? textesReponse.texteReponse
    : [textesReponse.texteReponse];

  // Get the most recent one
  const texte = textes[textes.length - 1];
  return {
    texte: texte?.texte || null,
    date: parseDate(texte?.dateJOReponse),
  };
}

function extractMinistere(question: QuestionAN): { acronyme: string | null; libelle: string | null } {
  // Try minInt first
  if (question.minInt) {
    return {
      acronyme: question.minInt.abrege || null,
      libelle: question.minInt.libelle || null,
    };
  }

  // Then try minAttribs
  if (question.minAttribs?.minAttrib) {
    const attribs = Array.isArray(question.minAttribs.minAttrib)
      ? question.minAttribs.minAttrib
      : [question.minAttribs.minAttrib];

    const attrib = attribs[0];
    if (attrib?.minAttrib) {
      return {
        acronyme: attrib.minAttrib.abrege || null,
        libelle: attrib.minAttrib.libelle || null,
      };
    }
  }

  return { acronyme: null, libelle: null };
}

// ==================== MAIN SYNC FUNCTION ====================

async function syncQuestionsFromZip(
  journalId: string,
  zipUrl: string,
  questionType: TypeQuestion,
  options: SyncOptions
): Promise<ResultatSync> {
  let crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-questions-${questionType}-${Date.now()}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    logInfo(`[${journalId}] Téléchargement ${questionType} depuis ${zipUrl}...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutes
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'questions.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Find JSON files
    const findJsonFiles = (dir: string): string[] => {
      const files: string[] = [];
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            files.push(...findJsonFiles(fullPath));
          } else if (entry.endsWith('.json')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Ignore errors
      }
      return files;
    };

    const jsonFiles = findJsonFiles(tempDir);
    logInfo(`[${journalId}] ${jsonFiles.length} fichiers JSON trouvés pour ${questionType}`);

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < jsonFiles.length; i += batchSize) {
      const batch = jsonFiles.slice(i, i + batchSize);

      for (const jsonFile of batch) {
        try {
          const content = fs.readFileSync(jsonFile, 'utf-8');
          const data = JSON.parse(content);

          // Structure: each file contains { question: {...} }
          const question = data.question as QuestionAN;

          if (!question?.uid) {
            continue;
          }

          const type = determinerTypeQuestion(question.type, question.uid);
          const legislature = parseInt(question.identifiant?.legislature || '17');
          const numero = parseInt(question.identifiant?.numero || '0');

          if (!numero) continue;

          const texteQuestion = extractTexteQuestion(question.textesQuestion);
          if (!texteQuestion) continue; // Skip if no question text

          const { texte: texteReponse, date: dateReponse } = extractTexteReponse(question.textesReponse);
          const dateQuestion = parseDate(question.dateDepot);
          if (!dateQuestion) continue;

          const { acronyme: ministereAcronyme, libelle: ministereDeveloppe } = extractMinistere(question);

          // Try to find linked deputy
          let deputeId: string | null = null;
          const acteurRef = question.auteur?.identite?.acteurRef;
          if (acteurRef) {
            const depute = await prisma.depute.findFirst({
              where: { acteurUid: acteurRef },
              select: { id: true }
            });
            if (depute) {
              deputeId = depute.id;
            }
          }

          const questionData = {
            uid: question.uid,
            type,
            numero,
            legislature,
            acteurRef: acteurRef || '',
            deputeId,
            groupeAcronyme: question.auteur?.groupe?.acronyme || null,
            groupeNom: question.auteur?.groupe?.nom || null,
            rubrique: question.indexationAN?.rubrique || null,
            analyse: question.indexationAN?.analyse || null,
            texteQuestion,
            texteReponse,
            ministereAcronyme,
            ministereDeveloppe,
            dateQuestion,
            dateReponse,
            statut: texteReponse ? 'REP_PUB' : (question.dateRetrait ? 'RETRAIT' : 'EN_COURS'),
          };

          // Upsert
          const existing = await prisma.question.findUnique({
            where: { uid: question.uid }
          });

          if (existing) {
            await prisma.question.update({
              where: { uid: question.uid },
              data: questionData,
            });
            misAJour++;
          } else {
            await prisma.question.create({
              data: questionData,
            });
            crees++;
          }

          // Limit for testing
          if (options.limite && (crees + misAJour) >= options.limite) {
            break;
          }

        } catch (e) {
          erreurs++;
          if (erreurs <= 10) {
            logError(`[${journalId}] Erreur traitement question:`, e);
          }
        }
      }

      if (options.limite && (crees + misAJour) >= options.limite) {
        break;
      }

      // Log progress
      if ((i + batchSize) % 500 === 0) {
        logInfo(`[${journalId}] Progression ${questionType}: ${i + batchSize} questions traitées...`);
      }
    }

  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }

  return { traites: crees + misAJour, crees, misAJour, erreurs };
}

export async function synchroniserQuestions(
  journalId: string,
  options: SyncOptions = {}
): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync questions parlementaires...`);

  const legislature = options.legislature || 17;
  const syncType = options.type || 'ALL';

  let totalCrees = 0, totalMisAJour = 0, totalErreurs = 0;

  // URLs for each question type
  const questionUrls = {
    QE: `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/questions/questions_ecrites/Questions_ecrites.json.zip`,
    QG: `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/questions/questions_gouvernement/Questions_gouvernement.json.zip`,
    QOSD: `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/questions/questions_orales_sans_debat/Questions_orales_sans_debat.json.zip`,
  };

  try {
    // Sync each question type
    const typesToSync = syncType === 'ALL'
      ? (['QE', 'QG', 'QOSD'] as const)
      : [syncType];

    for (const type of typesToSync) {
      const url = questionUrls[type];
      logInfo(`[${journalId}] Synchronisation ${type}...`);

      try {
        const result = await syncQuestionsFromZip(journalId, url, type, {
          ...options,
          limite: options.limite ? Math.ceil(options.limite / typesToSync.length) : undefined,
        });

        totalCrees += result.crees;
        totalMisAJour += result.misAJour;
        totalErreurs += result.erreurs;

        logInfo(`[${journalId}] ${type} terminé: ${result.crees} créées, ${result.misAJour} mises à jour`);
      } catch (e) {
        logError(`[${journalId}] Erreur sync ${type}:`, e);
        totalErreurs++;
      }
    }

  } catch (e) {
    totalErreurs++;
    logError(`[${journalId}] Erreur sync questions:`, e);
    throw e;
  }

  logInfo(`[${journalId}] Sync questions terminée: ${totalCrees} créées, ${totalMisAJour} mises à jour, ${totalErreurs} erreurs`);

  return {
    traites: totalCrees + totalMisAJour,
    crees: totalCrees,
    misAJour: totalMisAJour,
    erreurs: totalErreurs,
  };
}
