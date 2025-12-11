/**
 * Service de synchronisation des séances publiques depuis data.assemblee-nationale.fr
 * Source: https://data.assemblee-nationale.fr/travaux-parlementaires/debats
 * Format: XML (Syceron)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';

// ==================== TYPES ====================

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

interface CompteRenduXML {
  compteRendu: {
    uid: string;
    seanceRef?: string;
    sessionRef?: string;
    metadonnees?: {
      dateSeance?: string;
      dateSeanceJour?: string;
      numSeanceJour?: string;
      numSeance?: string;
      legislature?: string;
      session?: string;
      etat?: string;
      validite?: string;
      diffusion?: string;
      sommaire?: SommaireXML;
    };
    contenu?: {
      point?: PointXML | PointXML[];
      ouvertureSeance?: PointXML;
    };
  };
}

interface SommaireXML {
  presidentSeance?: string;
  sommaire1?: SommaireItem | SommaireItem[];
}

interface SommaireItem {
  titreStruct?: {
    intitule?: string;
    sousIntitule?: string;
  };
  para?: ParaItem | ParaItem[];
}

interface ParaItem {
  '#text'?: string;
  '@_id_syceron'?: string;
}

interface PointXML {
  texte?: string;
  paragraphe?: ParagrapheXML | ParagrapheXML[];
  '@_valeur_ptsodj'?: string;
  '@_id_syceron'?: string;
  point?: PointXML | PointXML[];
}

interface ParagrapheXML {
  orateurs?: {
    orateur?: OrateurXML | OrateurXML[];
  };
  texte?: TexteXML | string;
  '@_id_acteur'?: string;
  '@_roledebat'?: string;
  '@_code_grammaire'?: string;
  '@_ordre_absolu_seance'?: string;
}

interface OrateurXML {
  nom?: string;
  id?: string;
  qualite?: string;
}

interface TexteXML {
  '#text'?: string;
  '@_stime'?: string;
  italique?: string;
  br?: string;
}

interface InterventionData {
  acteurRef: string | null;
  orateur: string;
  qualite: string | null;
  roleDebat: string | null;
  texte: string;
  pointOdj: string | null;
  titrePoint: string | null;
  ordreAbsolu: number | null;
  stime: number | null;
  typeIntervention: string | null;
}

// ==================== HELPERS ====================

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  // Format: 20241001150000000
  if (dateStr.length >= 8) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = dateStr.length >= 10 ? parseInt(dateStr.substring(8, 10)) : 0;
    const minute = dateStr.length >= 12 ? parseInt(dateStr.substring(10, 12)) : 0;
    return new Date(year, month, day, hour, minute);
  }
  return null;
}

function extractText(texte: TexteXML | string | undefined): string {
  if (!texte) return '';
  if (typeof texte === 'string') return texte;

  let text = texte['#text'] || '';
  if (texte.italique) {
    text += ` ${texte.italique}`;
  }
  // Clean up HTML-like tags
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractInterventions(
  contenu: CompteRenduXML['compteRendu']['contenu']
): InterventionData[] {
  const interventions: InterventionData[] = [];

  if (!contenu) return interventions;

  const processPoint = (point: PointXML, currentTitle: string | null) => {
    const title = point.texte || currentTitle;
    const pointOdj = point['@_valeur_ptsodj'] || null;

    // Process paragraphes directly in this point
    if (point.paragraphe) {
      const paras = Array.isArray(point.paragraphe) ? point.paragraphe : [point.paragraphe];
      for (const para of paras) {
        const intervention = extractIntervention(para, title, pointOdj);
        if (intervention) {
          interventions.push(intervention);
        }
      }
    }

    // Process nested points
    if (point.point) {
      const nestedPoints = Array.isArray(point.point) ? point.point : [point.point];
      for (const nested of nestedPoints) {
        processPoint(nested, title);
      }
    }
  };

  // Process opening
  if (contenu.ouvertureSeance) {
    processPoint(contenu.ouvertureSeance, 'Ouverture de la séance');
  }

  // Process main points
  if (contenu.point) {
    const points = Array.isArray(contenu.point) ? contenu.point : [contenu.point];
    for (const point of points) {
      processPoint(point, null);
    }
  }

  return interventions;
}

function extractIntervention(
  para: ParagrapheXML,
  titrePoint: string | null,
  pointOdj: string | null
): InterventionData | null {
  const texte = extractText(para.texte);
  if (!texte || texte.length < 10) return null;

  let orateur = '';
  let qualite: string | null = null;
  let acteurRef: string | null = null;

  if (para.orateurs?.orateur) {
    const orateurData = Array.isArray(para.orateurs.orateur)
      ? para.orateurs.orateur[0]
      : para.orateurs.orateur;
    orateur = orateurData.nom || 'Inconnu';
    qualite = orateurData.qualite || null;
    if (orateurData.id && orateurData.id !== '0') {
      acteurRef = `PA${orateurData.id}`;
    }
  }

  if (!orateur) return null;

  const stime = para.texte && typeof para.texte === 'object' && para.texte['@_stime']
    ? parseFloat(para.texte['@_stime'])
    : null;

  return {
    acteurRef,
    orateur,
    qualite,
    roleDebat: para['@_roledebat'] || null,
    texte,
    pointOdj,
    titrePoint,
    ordreAbsolu: para['@_ordre_absolu_seance'] ? parseInt(para['@_ordre_absolu_seance']) : null,
    stime,
    typeIntervention: para['@_code_grammaire'] || null,
  };
}

function extractSommaire(sommaire: SommaireXML | undefined): string | null {
  if (!sommaire) return null;

  const items: { titre: string; orateurs: string[] }[] = [];

  if (sommaire.sommaire1) {
    const sommaires = Array.isArray(sommaire.sommaire1) ? sommaire.sommaire1 : [sommaire.sommaire1];
    for (const s of sommaires) {
      const titre = s.titreStruct?.intitule || '';
      const orateurs: string[] = [];
      if (s.para) {
        const paras = Array.isArray(s.para) ? s.para : [s.para];
        for (const p of paras) {
          const text = typeof p === 'string' ? p : p['#text'];
          if (text) orateurs.push(text);
        }
      }
      if (titre) {
        items.push({ titre, orateurs });
      }
    }
  }

  return items.length > 0 ? JSON.stringify(items) : null;
}

function extractOrateurs(interventions: InterventionData[]): string | null {
  const orateursMap = new Map<string, { nom: string; id: string | null; qualite: string | null; count: number }>();

  for (const inter of interventions) {
    const key = inter.acteurRef || inter.orateur;
    const existing = orateursMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      orateursMap.set(key, {
        nom: inter.orateur,
        id: inter.acteurRef,
        qualite: inter.qualite,
        count: 1,
      });
    }
  }

  const orateurs = Array.from(orateursMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // Top 50 speakers

  return orateurs.length > 0 ? JSON.stringify(orateurs) : null;
}

// ==================== MAIN SYNC FUNCTION ====================

export async function synchroniserSeancesPubliques(
  journalId: string,
  options: SyncOptions = {}
): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync séances publiques...`);

  const legislature = options.legislature || 17;
  let crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-seances-${Date.now()}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    const zipUrl = `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/vp/syceronbrut/syseron.xml.zip`;
    logInfo(`[${journalId}] Téléchargement depuis ${zipUrl}...`);

    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 600000, // 10 minutes (large file)
      headers: { 'User-Agent': 'PolitiqueFR/1.0' },
    });

    const zipPath = path.join(tempDir, 'syseron.xml.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Find XML files
    const findXmlFiles = (dir: string): string[] => {
      const files: string[] = [];
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            files.push(...findXmlFiles(fullPath));
          } else if (entry.endsWith('.xml')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Ignore errors
      }
      return files;
    };

    const xmlFiles = findXmlFiles(tempDir);
    logInfo(`[${journalId}] ${xmlFiles.length} fichiers XML trouvés`);

    // XML Parser options
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      trimValues: true,
    });

    // Process files with limit if specified
    const filesToProcess = options.limite
      ? xmlFiles.slice(0, options.limite)
      : xmlFiles;

    for (let i = 0; i < filesToProcess.length; i++) {
      const xmlFile = filesToProcess[i];
      try {
        const content = fs.readFileSync(xmlFile, 'utf-8');
        const data = parser.parse(content) as CompteRenduXML;

        const cr = data.compteRendu;
        if (!cr?.uid) continue;

        const dateSeance = parseDate(cr.metadonnees?.dateSeance);
        if (!dateSeance) continue;

        const leg = parseInt(cr.metadonnees?.legislature || String(legislature));

        // Extract interventions
        const interventions = extractInterventions(cr.contenu);

        const seanceData = {
          uid: cr.uid,
          seanceRef: cr.seanceRef || null,
          sessionRef: cr.sessionRef || null,
          legislature: leg,
          session: cr.metadonnees?.session || null,
          numSeance: cr.metadonnees?.numSeance ? parseInt(cr.metadonnees.numSeance) : null,
          numSeanceJour: cr.metadonnees?.numSeanceJour || null,
          dateSeance,
          dateSeanceStr: cr.metadonnees?.dateSeanceJour || null,
          sommaire: extractSommaire(cr.metadonnees?.sommaire),
          orateurs: extractOrateurs(interventions),
          nombreInterventions: interventions.length,
          nombreOrateurs: new Set(interventions.map((i) => i.acteurRef || i.orateur)).size,
          etat: cr.metadonnees?.etat || null,
          validite: cr.metadonnees?.validite || null,
          diffusion: cr.metadonnees?.diffusion || null,
          urlCompteRendu: `https://www.assemblee-nationale.fr/dyn/${leg}/comptes-rendus/seance/${cr.uid.toLowerCase()}`,
        };

        // Upsert seance
        const existing = await prisma.seancePublique.findUnique({
          where: { uid: cr.uid },
        });

        let seanceId: string;
        if (existing) {
          await prisma.seancePublique.update({
            where: { uid: cr.uid },
            data: seanceData,
          });
          seanceId = existing.id;
          misAJour++;

          // Delete existing interventions to re-create
          await prisma.intervention.deleteMany({
            where: { seanceId },
          });
        } else {
          const created = await prisma.seancePublique.create({
            data: seanceData,
          });
          seanceId = created.id;
          crees++;
        }

        // Create interventions (limited to first 500 for performance)
        const interventionsToCreate = interventions.slice(0, 500);
        if (interventionsToCreate.length > 0) {
          await prisma.intervention.createMany({
            data: interventionsToCreate.map((inter) => ({
              seanceId,
              acteurRef: inter.acteurRef,
              orateur: inter.orateur,
              qualite: inter.qualite,
              roleDebat: inter.roleDebat,
              texte: inter.texte,
              pointOdj: inter.pointOdj,
              titrePoint: inter.titrePoint,
              ordreAbsolu: inter.ordreAbsolu,
              stime: inter.stime,
              typeIntervention: inter.typeIntervention,
            })),
          });
        }

      } catch (e) {
        erreurs++;
        if (erreurs <= 10) {
          logError(`[${journalId}] Erreur traitement ${path.basename(xmlFile)}:`, e);
        }
      }

      // Log progress
      if ((i + 1) % 50 === 0 || i === filesToProcess.length - 1) {
        logInfo(`[${journalId}] Progression: ${i + 1}/${filesToProcess.length} fichiers traités...`);
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

  logInfo(`[${journalId}] Sync séances terminée: ${crees} créées, ${misAJour} mises à jour, ${erreurs} erreurs`);

  return {
    traites: crees + misAJour,
    crees,
    misAJour,
    erreurs,
  };
}
