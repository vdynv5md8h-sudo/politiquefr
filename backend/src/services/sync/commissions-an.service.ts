/**
 * Service de synchronisation des commissions parlementaires depuis data.assemblee-nationale.fr
 * Source: https://data.assemblee-nationale.fr/travaux-parlementaires/reunions
 *
 * Sync:
 * 1. Toutes les commissions (permanentes, spéciales, enquête, etc.) dans CommissionParlementaire
 * 2. Les liens députés-commissions dans MembreCommission
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { TypeCommission, Chambre, RoleCommission } from '@prisma/client';

// ==================== TYPES ====================

interface ResultatSync {
  traites: number;
  crees: number;
  misAJour: number;
  erreurs: number;
}

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

interface MandatAN {
  uid: string;
  acteurRef: string;
  legislature: string;
  typeOrgane: string;
  dateDebut: string;
  dateFin?: string;
  infosQualite?: {
    codeQualite?: string;
    libQualite?: string;
    libQualiteSex?: string;
  };
  organesRef?: string | string[];
}

interface ActeurAN {
  uid: string;
  mandats?: {
    mandat?: MandatAN | MandatAN[];
  };
}

// ==================== HELPERS ====================

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Map AN codeType to our TypeCommission enum
function mapTypeCommission(codeType: string): TypeCommission | null {
  const mapping: Record<string, TypeCommission> = {
    'COMPER': 'PERMANENTE',
    'COMSPAM': 'SPECIALE',
    'CEnq': 'ENQUETE',
    'CENQ': 'ENQUETE',
    'CMP': 'MIXTE_PARITAIRE',
    'COMADHOC': 'AD_HOC',
    'COMHOC': 'AD_HOC',
  };
  return mapping[codeType] || null;
}

// Map AN quality code to our RoleCommission enum
function mapRoleCommission(codeQualite?: string): RoleCommission {
  if (!codeQualite) return 'MEMBRE';

  const code = codeQualite.toUpperCase();
  if (code.includes('PRESIDENT') || code === 'PRS') return 'PRESIDENT';
  if (code.includes('VICE') || code === 'VPR') return 'VICE_PRESIDENT';
  if (code.includes('SECRET') || code === 'SEC') return 'SECRETAIRE';
  return 'MEMBRE';
}

// ==================== SYNC COMMISSIONS ====================

export async function synchroniserCommissions(journalId: string): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync commissions parlementaires...`);

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-commissions-full-${Date.now()}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // URL pour tous les organes
    const zipUrl = 'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip';

    logInfo(`[${journalId}] Téléchargement des organes...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutes
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'organes.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Find organes directory (may be in subdirectory)
    let organesDir = path.join(tempDir, 'json', 'organe');
    if (!fs.existsSync(organesDir)) {
      const subDirs = fs.readdirSync(tempDir);
      for (const dir of subDirs) {
        const potentialPath = path.join(tempDir, dir, 'json', 'organe');
        if (fs.existsSync(potentialPath)) {
          organesDir = potentialPath;
          break;
        }
      }
    }

    if (!fs.existsSync(organesDir)) {
      throw new Error('Répertoire organes non trouvé');
    }

    const organeFiles = fs.readdirSync(organesDir).filter(f => f.endsWith('.json'));
    logInfo(`[${journalId}] ${organeFiles.length} fichiers organes trouvés`);

    // Commission types to sync
    const commissionCodeTypes = new Set(['COMPER', 'COMSPAM', 'CEnq', 'CENQ', 'CMP', 'COMADHOC', 'COMHOC']);

    for (const file of organeFiles) {
      try {
        const content = fs.readFileSync(path.join(organesDir, file), 'utf-8');
        const data = JSON.parse(content);
        const organe = data.organe as OrganeAN;

        if (!organe?.uid) continue;

        // Filter only commission types
        if (!commissionCodeTypes.has(organe.codeType)) continue;

        traites++;

        const typeCommission = mapTypeCommission(organe.codeType);
        if (!typeCommission) continue;

        const legislature = organe.legislature ? parseInt(organe.legislature) : 17;
        const dateDebut = parseDate(organe.viMoDe?.dateDebut);
        const dateFin = parseDate(organe.viMoDe?.dateFin);

        const commissionData = {
          uid: organe.uid,
          nom: organe.libelle,
          nomCourt: organe.libelleAbrev || organe.libelleAbrege || null,
          typeCommission,
          chambre: 'ASSEMBLEE' as Chambre,
          legislature,
          dateDebut,
          dateFin,
          actif: !dateFin,
          urlCommission: `https://www.assemblee-nationale.fr/dyn/org/${organe.uid}`,
        };

        // Upsert commission
        const existing = await prisma.commissionParlementaire.findUnique({
          where: { uid: organe.uid }
        });

        if (existing) {
          await prisma.commissionParlementaire.update({
            where: { uid: organe.uid },
            data: commissionData,
          });
          misAJour++;
        } else {
          await prisma.commissionParlementaire.create({
            data: commissionData,
          });
          crees++;
        }

      } catch (e) {
        erreurs++;
        if (erreurs <= 10) {
          logError(`[${journalId}] Erreur traitement ${file}:`, e);
        }
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync commissions:`, e);
    throw e;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }

  logInfo(`[${journalId}] Sync commissions terminée: ${crees} créées, ${misAJour} mises à jour, ${erreurs} erreurs`);

  return { traites, crees, misAJour, erreurs };
}

// ==================== SYNC MEMBRES COMMISSIONS ====================

export async function synchroniserMembresCommissions(journalId: string): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync membres des commissions...`);

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-membres-comm-${Date.now()}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // Download deputies with their mandates
    const zipUrl = 'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes_divises/AMO20_dep_act_man_act_org_div.json.zip';

    logInfo(`[${journalId}] Téléchargement des députés...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 180000,
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'deputes.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Load commissions map (uid -> id)
    const commissions = await prisma.commissionParlementaire.findMany({
      select: { id: true, uid: true }
    });
    const commissionMap = new Map(commissions.map(c => [c.uid, c.id]));
    logInfo(`[${journalId}] ${commissionMap.size} commissions en base`);

    // Load deputies map (acteurUid -> id)
    const deputes = await prisma.depute.findMany({
      where: { acteurUid: { not: null } },
      select: { id: true, acteurUid: true }
    });
    const deputeMap = new Map(deputes.map(d => [d.acteurUid!, d.id]));
    logInfo(`[${journalId}] ${deputeMap.size} députés en base`);

    // Commission type codes
    const commissionCodeTypes = new Set(['COMPER', 'COMSPAM', 'CEnq', 'CENQ', 'CMP', 'COMADHOC', 'COMHOC']);

    // Find acteurs directory
    const acteursDir = path.join(tempDir, 'json', 'acteur');
    if (!fs.existsSync(acteursDir)) {
      throw new Error('Répertoire acteurs non trouvé');
    }

    const acteurFiles = fs.readdirSync(acteursDir).filter(f => f.endsWith('.json'));
    logInfo(`[${journalId}] ${acteurFiles.length} acteurs trouvés`);

    // Clear existing memberships (to rebuild fresh)
    await prisma.membreCommission.deleteMany({});
    logInfo(`[${journalId}] Memberships existants supprimés`);

    const membershipsToCreate: {
      deputeId: string;
      commissionId: string;
      role: RoleCommission;
      dateDebut: Date | null;
      dateFin: Date | null;
      actif: boolean;
    }[] = [];

    for (const file of acteurFiles) {
      try {
        const content = fs.readFileSync(path.join(acteursDir, file), 'utf-8');
        const data = JSON.parse(content);
        const acteur = data.acteur as ActeurAN;

        if (!acteur?.uid) continue;

        const deputeId = deputeMap.get(acteur.uid);
        if (!deputeId) continue; // Not a deputy in our database

        traites++;

        // Get mandats
        const mandats = acteur.mandats?.mandat;
        if (!mandats) continue;

        const mandatsArray = Array.isArray(mandats) ? mandats : [mandats];

        // Find commission mandates
        for (const mandat of mandatsArray) {
          if (!commissionCodeTypes.has(mandat.typeOrgane)) continue;

          // Get organ references
          let organesRefs: string[] = [];
          if (mandat.organesRef) {
            organesRefs = Array.isArray(mandat.organesRef)
              ? mandat.organesRef
              : [mandat.organesRef];
          }

          // Also check if the mandate itself points to an organ
          // Sometimes organesRef contains the commission UID directly
          for (const orgRef of organesRefs) {
            const commissionId = commissionMap.get(orgRef);
            if (!commissionId) continue;

            const role = mapRoleCommission(mandat.infosQualite?.codeQualite);
            const dateDebut = parseDate(mandat.dateDebut);
            const dateFin = parseDate(mandat.dateFin);

            membershipsToCreate.push({
              deputeId,
              commissionId,
              role,
              dateDebut,
              dateFin,
              actif: !dateFin,
            });
          }
        }

      } catch (e) {
        erreurs++;
        if (erreurs <= 10) {
          logError(`[${journalId}] Erreur traitement ${file}:`, e);
        }
      }
    }

    // Deduplicate memberships (same deputy+commission, keep most recent role)
    const uniqueMemberships = new Map<string, typeof membershipsToCreate[0]>();
    for (const m of membershipsToCreate) {
      const key = `${m.deputeId}-${m.commissionId}`;
      const existing = uniqueMemberships.get(key);
      if (!existing || (m.actif && !existing.actif) || (m.role !== 'MEMBRE' && existing.role === 'MEMBRE')) {
        uniqueMemberships.set(key, m);
      }
    }

    // Batch insert
    const membershipsArray = Array.from(uniqueMemberships.values());
    logInfo(`[${journalId}] ${membershipsArray.length} memberships uniques à créer`);

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < membershipsArray.length; i += batchSize) {
      const batch = membershipsArray.slice(i, i + batchSize);
      await prisma.membreCommission.createMany({
        data: batch,
        skipDuplicates: true,
      });
      crees += batch.length;

      if ((i + batchSize) % 500 === 0) {
        logInfo(`[${journalId}] Progression: ${Math.min(i + batchSize, membershipsArray.length)}/${membershipsArray.length} membres créés`);
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync membres commissions:`, e);
    throw e;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }

  logInfo(`[${journalId}] Sync membres terminée: ${crees} créés, ${erreurs} erreurs`);

  return { traites, crees, misAJour, erreurs };
}
