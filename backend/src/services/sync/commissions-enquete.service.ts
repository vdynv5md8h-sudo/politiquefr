/**
 * Service de synchronisation des commissions d'enquête depuis data.assemblee-nationale.fr
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { StatutCommissionEnquete, Chambre } from '@prisma/client';

// ==================== TYPES ====================

interface OrganeAN {
  uid: string;
  codeType: string;
  libelle: string;
  libelleAbrev?: string;
  libelleAbrege?: string;
  legislature?: string;
  viMoDe?: {
    dateDebut?: string;
    dateFin?: string;
  };
  secretariat?: {
    secretaire01?: { libelle?: string };
  };
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

function determinerStatut(dateFin?: string | null): StatutCommissionEnquete {
  if (dateFin) {
    return 'TERMINE';
  }
  return 'EN_COURS';
}

// ==================== MAIN SYNC FUNCTION ====================

export async function synchroniserCommissionsEnquete(journalId: string): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync commissions d'enquête...`);

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-commissions-${Date.now()}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // URL pour les organes (contient les commissions)
    const zipUrl = 'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip';

    logInfo(`[${journalId}] Téléchargement des organes...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 180000,
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'organes.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Chercher les fichiers d'organes
    const organesDir = path.join(tempDir, 'json', 'organe');
    if (!fs.existsSync(organesDir)) {
      // Structure alternative
      const subDirs = fs.readdirSync(tempDir);
      for (const dir of subDirs) {
        const potentialPath = path.join(tempDir, dir, 'json', 'organe');
        if (fs.existsSync(potentialPath)) {
          fs.renameSync(potentialPath, organesDir);
          break;
        }
      }
    }

    if (!fs.existsSync(organesDir)) {
      throw new Error('Répertoire organes non trouvé');
    }

    const organeFiles = fs.readdirSync(organesDir).filter(f => f.endsWith('.json'));
    logInfo(`[${journalId}] ${organeFiles.length} fichiers organes trouvés`);

    for (const file of organeFiles) {
      try {
        const content = fs.readFileSync(path.join(organesDir, file), 'utf-8');
        const data = JSON.parse(content);
        const organe = data.organe as OrganeAN;

        if (!organe?.uid) continue;

        // Filtrer uniquement les commissions d'enquête (CEnq)
        if (organe.codeType !== 'CEnq' && organe.codeType !== 'CENQ') continue;

        traites++;

        const legislature = organe.legislature ? parseInt(organe.legislature) : 17;
        const dateFin = parseDate(organe.viMoDe?.dateFin);

        const commissionData = {
          uid: organe.uid,
          titre: organe.libelle,
          sujet: organe.libelle, // Le libellé contient souvent le sujet
          legislature,
          chambre: 'ASSEMBLEE' as Chambre,
          dateCreation: parseDate(organe.viMoDe?.dateDebut) || new Date(),
          dateFin,
          statut: determinerStatut(organe.viMoDe?.dateFin),
        };

        // Upsert
        const existing = await prisma.commissionEnquete.findUnique({
          where: { uid: organe.uid }
        });

        if (existing) {
          await prisma.commissionEnquete.update({
            where: { uid: organe.uid },
            data: commissionData,
          });
          misAJour++;
        } else {
          await prisma.commissionEnquete.create({
            data: commissionData,
          });
          crees++;
        }

      } catch (e) {
        erreurs++;
        logError(`[${journalId}] Erreur traitement ${file}:`, e);
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync commissions d'enquête:`, e);
    throw e;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignorer
    }
  }

  logInfo(`[${journalId}] Sync commissions terminée: ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);

  return { traites, crees, misAJour, erreurs };
}
