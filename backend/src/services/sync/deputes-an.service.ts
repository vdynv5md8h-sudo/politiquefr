/**
 * Service de synchronisation des députés depuis data.assemblee-nationale.fr
 * Source: https://data.assemblee-nationale.fr/acteurs/deputes-en-exercice
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';

// ==================== TYPES ====================

interface ActeurAN {
  uid: string;
  etatCivil: {
    ident: {
      civ: string; // M. ou Mme
      prenom: string;
      nom: string;
      alpha?: string;
      trigramme?: string;
    };
    infoNaissance?: {
      dateNais: string;
      villeNais: string;
      depNais: string;
      paysNais: string;
    };
  };
  profession?: {
    libelleCourant?: string;
    socProcINSEE?: {
      catSocPro?: string;
      famSocPro?: string;
    };
  };
  adresses?: {
    adresse?: Array<{
      type: string;
      typeLibelle: string;
      valElec?: string;
      adresseDeRattachement?: string;
    }>;
  };
  uri_hatvp?: string;
}

interface MandatAN {
  uid: string;
  acteurRef: string;
  legislature: string;
  typeOrgane: string;
  dateDebut: string;
  dateFin?: string;
  prelesion?: {
    numero: string;
    numDepartement: string;
    datePriseFonction: string;
  };
  election?: {
    lieu?: {
      numDepartement: string;
      nomDepartement: string;
      numCirco: string;
    };
    refCirconscription: string;
  };
  infosQualite?: {
    codeQualite: string;
  };
  organesRef?: string[];
  suppleantRef?: string;
}

interface OrganeAN {
  uid: string;
  codeType: string;
  libelle: string;
  libelleAbrev?: string;
  libelleAbrege?: string;
  viMoDe?: {
    dateDebut?: string;
    dateFin?: string;
  };
  legislature?: string;
  positionPolitique?: string;
  couleurAssociee?: string;
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

function extractEmail(adresses: ActeurAN['adresses']): string | null {
  if (!adresses?.adresse) return null;
  const emailAddr = adresses.adresse.find(a => a.type === '15' || a.typeLibelle === 'Mèl');
  return emailAddr?.valElec || null;
}

function extractTwitter(adresses: ActeurAN['adresses']): string | null {
  if (!adresses?.adresse) return null;
  const twitter = adresses.adresse.find(a =>
    a.type === '24' ||
    a.typeLibelle?.toLowerCase().includes('twitter') ||
    a.valElec?.includes('twitter.com')
  );
  if (twitter?.valElec) {
    const match = twitter.valElec.match(/twitter\.com\/([^/?]+)/);
    return match ? `@${match[1]}` : twitter.valElec;
  }
  return null;
}

function generateSlug(prenom: string, nom: string): string {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `${normalize(prenom)}-${normalize(nom)}`;
}

// ==================== MAIN SYNC FUNCTION ====================

export async function synchroniserDeputesAN(journalId: string): Promise<ResultatSync> {
  logInfo(`[${journalId}] Démarrage sync députés depuis AN...`);

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;
  const tempDir = path.join(os.tmpdir(), `an-deputes-${Date.now()}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // Télécharger et extraire le fichier ZIP
    const zipUrl = 'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes_divises/AMO20_dep_act_man_act_org_div.json.zip';

    logInfo(`[${journalId}] Téléchargement du fichier ZIP...`);
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: { 'User-Agent': 'PolitiqueFR/1.0' }
    });

    const zipPath = path.join(tempDir, 'deputes.zip');
    fs.writeFileSync(zipPath, response.data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Charger les fichiers JSON
    const acteursDir = path.join(tempDir, 'json', 'acteur');
    const organesDir = path.join(tempDir, 'json', 'organe');

    // D'abord charger les organes (groupes politiques)
    const groupesMap = new Map<string, OrganeAN>();
    if (fs.existsSync(organesDir)) {
      const organeFiles = fs.readdirSync(organesDir).filter(f => f.endsWith('.json'));
      for (const file of organeFiles) {
        try {
          const content = fs.readFileSync(path.join(organesDir, file), 'utf-8');
          const organe = JSON.parse(content).organe as OrganeAN;
          if (organe && organe.codeType === 'GP') { // GP = Groupe Politique
            groupesMap.set(organe.uid, organe);
          }
        } catch (e) {
          // Ignorer les fichiers invalides
        }
      }
      logInfo(`[${journalId}] ${groupesMap.size} groupes politiques chargés`);
    }

    // Créer/mettre à jour les groupes dans la BDD
    for (const [uid, organe] of groupesMap) {
      try {
        await prisma.groupePolitique.upsert({
          where: { id: uid },
          update: {
            nom: organe.libelle,
            acronyme: organe.libelleAbrev || organe.libelleAbrege || organe.libelle.substring(0, 10),
            positionPolitique: organe.positionPolitique,
            couleur: organe.couleurAssociee,
            actif: !organe.viMoDe?.dateFin,
          },
          create: {
            id: uid,
            nom: organe.libelle,
            acronyme: organe.libelleAbrev || organe.libelleAbrege || organe.libelle.substring(0, 10),
            chambre: 'ASSEMBLEE',
            positionPolitique: organe.positionPolitique,
            couleur: organe.couleurAssociee,
            nombreMembres: 0,
            actif: !organe.viMoDe?.dateFin,
          }
        });
      } catch (e) {
        logError(`[${journalId}] Erreur création groupe ${uid}:`, e);
      }
    }

    // Traiter les acteurs (députés)
    if (!fs.existsSync(acteursDir)) {
      throw new Error(`Répertoire acteurs non trouvé: ${acteursDir}`);
    }

    const acteurFiles = fs.readdirSync(acteursDir).filter(f => f.endsWith('.json'));
    logInfo(`[${journalId}] ${acteurFiles.length} acteurs trouvés`);

    for (const file of acteurFiles) {
      try {
        traites++;
        const content = fs.readFileSync(path.join(acteursDir, file), 'utf-8');
        const data = JSON.parse(content);
        const acteur = data.acteur as ActeurAN;

        if (!acteur?.uid) continue;

        // Trouver le mandat de député actif
        const mandats = data.acteur.mandats?.mandat || [];
        const mandatsArray = Array.isArray(mandats) ? mandats : [mandats];
        const mandatDepute = mandatsArray.find((m: MandatAN) =>
          m.typeOrgane === 'ASSEMBLEE' && !m.dateFin
        );

        if (!mandatDepute) continue; // Pas un député actif

        // Trouver le groupe politique actuel
        let groupeId: string | null = null;
        const mandatGroupe = mandatsArray.find((m: MandatAN) =>
          m.typeOrgane === 'GP' && !m.dateFin
        );
        if (mandatGroupe?.organesRef) {
          const organeRef = Array.isArray(mandatGroupe.organesRef)
            ? mandatGroupe.organesRef[0]
            : mandatGroupe.organesRef;
          if (groupesMap.has(organeRef)) {
            groupeId = organeRef;
          }
        }

        const ident = acteur.etatCivil.ident;
        const naissance = acteur.etatCivil.infoNaissance;
        const election = mandatDepute.election;

        const deputeData = {
          acteurUid: acteur.uid,
          civilite: ident.civ === 'M.' ? 'M.' : 'Mme',
          prenom: ident.prenom,
          nom: ident.nom,
          slug: generateSlug(ident.prenom, ident.nom),
          dateNaissance: parseDate(naissance?.dateNais),
          lieuNaissance: naissance?.villeNais,
          profession: acteur.profession?.libelleCourant,
          legislature: parseInt(mandatDepute.legislature) || 17,
          numeroCirconscription: election?.lieu?.numCirco
            ? parseInt(election.lieu.numCirco)
            : 1,
          departement: election?.lieu?.nomDepartement || 'Inconnu',
          codeDepartement: election?.lieu?.numDepartement,
          dateDebutMandat: parseDate(mandatDepute.dateDebut) || new Date(),
          dateFinMandat: parseDate(mandatDepute.dateFin),
          mandatEnCours: !mandatDepute.dateFin,
          groupeId,
          email: extractEmail(acteur.adresses),
          twitter: extractTwitter(acteur.adresses),
          urlAssemblee: `https://www.assemblee-nationale.fr/dyn/deputes/${acteur.uid}`,
          urlAssembleeNationale: `https://www.assemblee-nationale.fr/dyn/deputes/${acteur.uid}`,
        };

        // Upsert par acteurUid
        const existing = await prisma.depute.findFirst({
          where: {
            OR: [
              { acteurUid: acteur.uid },
              { slug: deputeData.slug }
            ]
          }
        });

        if (existing) {
          await prisma.depute.update({
            where: { id: existing.id },
            data: deputeData,
          });
          misAJour++;
        } else {
          await prisma.depute.create({
            data: deputeData,
          });
          crees++;
        }

      } catch (e) {
        erreurs++;
        logError(`[${journalId}] Erreur traitement ${file}:`, e);
      }
    }

    // Mettre à jour le nombre de membres par groupe
    const groupesCounts = await prisma.depute.groupBy({
      by: ['groupeId'],
      where: { mandatEnCours: true },
      _count: { id: true }
    });

    for (const gc of groupesCounts) {
      if (gc.groupeId) {
        await prisma.groupePolitique.update({
          where: { id: gc.groupeId },
          data: { nombreMembres: gc._count.id }
        });
      }
    }

  } catch (e) {
    erreurs++;
    logError(`[${journalId}] Erreur sync députés AN:`, e);
    throw e;
  } finally {
    // Nettoyer le répertoire temporaire
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignorer erreurs de nettoyage
    }
  }

  logInfo(`[${journalId}] Sync députés AN terminée: ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);

  return { traites, crees, misAJour, erreurs };
}
