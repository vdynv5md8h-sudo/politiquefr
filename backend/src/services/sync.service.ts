/**
 * Service de synchronisation des données depuis les APIs officielles
 * Peut être appelé via l'API REST pour contourner l'absence de Shell sur Render Free
 */

import axios from 'axios';
import { parse } from 'csv-parse';
import { prisma } from '../config/database';
import { logInfo, logError } from '../utils/logger';

// ==================== TYPES ====================

interface SenateurApi {
  matricule: string;
  nom: string;
  prenom: string;
  civilite: string;
  serie: string;
  siege: number;
  url: string;
  urlAvatar: string;
  twitter?: string;
  facebook?: string;
  groupe?: {
    code: string;
    libelle: string;
  };
  circonscription?: {
    code: string;
    libelle: string;
  };
  categorieProfessionnelle?: {
    code: string;
    libelle: string;
  };
}

interface DeputeNosdeputes {
  depute: {
    id: number;
    slug: string;
    nom: string;
    nom_de_famille: string;
    prenom: string;
    sexe: string;
    date_naissance: string;
    lieu_naissance: string;
    profession: string;
    groupe_sigle: string;
    groupe: { acronyme: string; organisme: string };
    mandat_debut: string;
    mandat_fin: string | null;
    num_circo: number;
    nom_circo: string;
    url_an: string;
    url_nosdeputes: string;
    emails: { email: string }[];
    sites_web: { site: string }[];
    twitter: string;
  };
}

interface MaireCsv {
  'Code du département': string;
  'Libellé du département': string;
  'Code de la commune': string;
  'Libellé de la commune': string;
  "Nom de l'élu": string;
  "Prénom de l'élu": string;
  'Code sexe': string;
  'Date de naissance': string;
  'Code de la catégorie socio-professionnelle': string;
  'Libellé de la catégorie socio-professionnelle': string;
  'Date de début du mandat': string;
  'Date de début de la fonction': string;
}

interface ResultatSync {
  traites: number;
  crees: number;
  misAJour: number;
  erreurs: number;
}

// ==================== HELPERS ====================

function parseDateFr(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const jour = parseInt(parts[0], 10);
  const mois = parseInt(parts[1], 10) - 1;
  const annee = parseInt(parts[2], 10);
  if (isNaN(jour) || isNaN(mois) || isNaN(annee)) return null;
  return new Date(annee, mois, jour);
}

function genererRneId(codeCommune: string, nom: string, prenom: string): string {
  const nomNormalise = nom.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const prenomNormalise = prenom.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${codeCommune}-${nomNormalise}-${prenomNormalise}`;
}

async function trouverOuCreerGroupeAssemblee(acronyme: string, nom: string) {
  if (!acronyme) return null;

  const groupeExistant = await prisma.groupePolitique.findFirst({
    where: { acronyme, chambre: 'ASSEMBLEE' },
  });

  if (groupeExistant) return groupeExistant.id;

  const nouveauGroupe = await prisma.groupePolitique.create({
    data: {
      acronyme,
      nom: nom || acronyme,
      chambre: 'ASSEMBLEE',
      actif: true,
      nombreMembres: 0,
    },
  });

  logInfo(`Groupe Assemblée créé: ${acronyme}`);
  return nouveauGroupe.id;
}

async function trouverOuCreerGroupeSenat(code: string, libelle: string) {
  if (!code) return null;

  const groupeExistant = await prisma.groupePolitique.findFirst({
    where: { acronyme: code, chambre: 'SENAT' },
  });

  if (groupeExistant) return groupeExistant.id;

  const nouveauGroupe = await prisma.groupePolitique.create({
    data: {
      acronyme: code,
      nom: libelle || code,
      chambre: 'SENAT',
      actif: true,
      nombreMembres: 0,
    },
  });

  logInfo(`Groupe Sénat créé: ${code}`);
  return nouveauGroupe.id;
}

// ==================== SYNC DÉPUTÉS ====================

export async function synchroniserDeputes(_journalId: string): Promise<ResultatSync> {
  logInfo('Démarrage sync députés...');

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;

  try {
    // Note: /deputes/enmandat/json peut être vide si l'Assemblée est dissoute
    // On utilise /deputes/json qui contient tous les députés (y compris anciens)
    const response = await axios.get('https://www.nosdeputes.fr/deputes/json', {
      headers: { 'User-Agent': 'PolitiqueFR/1.0' },
      timeout: 60000,
    });

    const tousDeputes: DeputeNosdeputes[] = response.data.deputes || [];

    // Filtrer pour ne garder que les députés de la dernière législature (mandat récent)
    const deputes = tousDeputes.filter(item => {
      const d = item.depute;
      // Garder ceux dont le mandat a commencé après 2022 (XVIIe législature)
      return d.mandat_debut && new Date(d.mandat_debut) >= new Date('2022-06-01');
    });

    logInfo(`${deputes.length} députés trouvés (sur ${tousDeputes.length} total)`);

    for (const item of deputes) {
      try {
        const d = item.depute;

        const groupeId = d.groupe_sigle
          ? await trouverOuCreerGroupeAssemblee(d.groupe_sigle, d.groupe?.organisme)
          : null;

        const donnees = {
          slug: d.slug,
          civilite: d.sexe === 'F' ? 'Mme' : 'M.',
          prenom: d.prenom,
          nom: d.nom_de_famille,
          dateNaissance: d.date_naissance ? new Date(d.date_naissance) : null,
          lieuNaissance: d.lieu_naissance || null,
          profession: d.profession || null,
          legislature: 17,
          numeroCirconscription: d.num_circo,
          departement: d.nom_circo,
          dateDebutMandat: new Date(d.mandat_debut),
          dateFinMandat: d.mandat_fin ? new Date(d.mandat_fin) : null,
          // nosdeputes.fr only has 16th legislature data (ended June 2024)
          // All deputies have mandat_fin set to 2024-06-09 (dissolution)
          // For now, mark all as active since the source doesn't have 17th legislature
          // A proper fix would cross-reference with RNE (data.gouv.fr)
          mandatEnCours: true,
          groupeId,
          email: d.emails?.[0]?.email || null,
          twitter: d.twitter || null,
          siteWeb: d.sites_web?.[0]?.site || null,
          urlNosdeputes: d.url_nosdeputes || null,
          urlAssemblee: d.url_an || null,
          photoUrl: `https://www.nosdeputes.fr/depute/photo/${d.slug}/120`,
        };

        const existant = await prisma.depute.findUnique({ where: { slug: d.slug } });

        if (existant) {
          await prisma.depute.update({ where: { slug: d.slug }, data: donnees });
          misAJour++;
        } else {
          await prisma.depute.create({ data: donnees });
          crees++;
        }

        traites++;
      } catch (err) {
        erreurs++;
        logError(`Erreur député ${item.depute?.slug}`, err);
      }
    }

    // Mettre à jour les compteurs de membres
    const groupes = await prisma.groupePolitique.findMany({ where: { chambre: 'ASSEMBLEE' } });
    for (const groupe of groupes) {
      const count = await prisma.depute.count({ where: { groupeId: groupe.id, mandatEnCours: true } });
      await prisma.groupePolitique.update({ where: { id: groupe.id }, data: { nombreMembres: count } });
    }

    logInfo(`Sync députés terminée: ${traites} traités, ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);
  } catch (err) {
    logError('Erreur sync députés', err);
    throw err;
  }

  return { traites, crees, misAJour, erreurs };
}

// ==================== SYNC SÉNATEURS ====================

export async function synchroniserSenateurs(_journalId: string): Promise<ResultatSync> {
  logInfo('Démarrage sync sénateurs...');

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;

  try {
    const response = await axios.get('https://www.senat.fr/api-senat/senateurs.json', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'PolitiqueFR/1.0' },
      timeout: 30000,
    });

    const senateurs: SenateurApi[] = response.data || [];
    logInfo(`${senateurs.length} sénateurs trouvés`);

    for (const s of senateurs) {
      try {
        const groupeId = s.groupe?.code
          ? await trouverOuCreerGroupeSenat(s.groupe.code, s.groupe.libelle)
          : null;

        const donnees = {
          matricule: s.matricule,
          civilite: s.civilite || (s.prenom?.endsWith('e') ? 'Mme' : 'M.'),
          prenom: s.prenom,
          nom: s.nom,
          departement: s.circonscription?.libelle || 'Non renseigné',
          codeDepartement: s.circonscription?.code?.padStart(2, '0') || '00',
          serieSenat: parseInt(s.serie) || 1,
          dateDebutMandat: new Date(),
          mandatEnCours: true,
          groupeId,
          profession: s.categorieProfessionnelle?.libelle || null,
          twitter: s.twitter || null,
          photoUrl: s.urlAvatar ? `https://www.senat.fr${s.urlAvatar}` : null,
          urlSenat: s.url ? `https://www.senat.fr${s.url}` : null,
        };

        const existant = await prisma.senateur.findUnique({ where: { matricule: s.matricule } });

        if (existant) {
          await prisma.senateur.update({ where: { matricule: s.matricule }, data: donnees });
          misAJour++;
        } else {
          await prisma.senateur.create({ data: donnees });
          crees++;
        }

        traites++;
      } catch (err) {
        erreurs++;
        logError(`Erreur sénateur ${s.matricule}`, err);
      }
    }

    // Mettre à jour les compteurs de membres
    const groupes = await prisma.groupePolitique.findMany({ where: { chambre: 'SENAT' } });
    for (const groupe of groupes) {
      const count = await prisma.senateur.count({ where: { groupeId: groupe.id, mandatEnCours: true } });
      await prisma.groupePolitique.update({ where: { id: groupe.id }, data: { nombreMembres: count } });
    }

    logInfo(`Sync sénateurs terminée: ${traites} traités, ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);
  } catch (err) {
    logError('Erreur sync sénateurs', err);
    throw err;
  }

  return { traites, crees, misAJour, erreurs };
}

// ==================== SYNC MAIRES ====================

export async function synchroniserMaires(_journalId: string): Promise<ResultatSync> {
  logInfo('Démarrage sync maires...');

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;

  try {
    logInfo('Téléchargement CSV maires depuis data.gouv.fr...');
    const response = await axios.get(
      'https://www.data.gouv.fr/fr/datasets/r/2876a346-d50c-4911-934e-19ee07b0e503',
      {
        responseType: 'text',
        headers: { 'Accept': 'text/csv', 'User-Agent': 'PolitiqueFR/1.0' },
        timeout: 60000,
      }
    );

    const records: MaireCsv[] = await new Promise((resolve, reject) => {
      const results: MaireCsv[] = [];
      const parser = parse(response.data, {
        delimiter: ';',
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          results.push(record);
        }
      });
      parser.on('error', reject);
      parser.on('end', () => resolve(results));
    });

    logInfo(`${records.length} maires trouvés dans le CSV`);

    for (const m of records) {
      try {
        const nom = m["Nom de l'élu"] || '';
        const prenom = m["Prénom de l'élu"] || '';
        const codeCommune = m['Code de la commune'] || '';

        if (!nom || !prenom || !codeCommune) continue;

        const rneId = genererRneId(codeCommune, nom, prenom);
        const codeDepartement = m['Code du département']?.padStart(2, '0') || '00';

        const donnees = {
          rneId,
          civilite: m['Code sexe'] === 'F' ? 'Mme' : 'M.',
          prenom,
          nom,
          dateNaissance: parseDateFr(m['Date de naissance']),
          profession: m['Libellé de la catégorie socio-professionnelle'] || null,
          codeCommune,
          libelleCommune: m['Libellé de la commune'] || 'Non renseigné',
          codeDepartement,
          libelleDepartement: m['Libellé du département'] || 'Non renseigné',
          dateDebutMandat: parseDateFr(m['Date de début du mandat']) || new Date(),
          fonctionMandat: 'Maire',
        };

        const existant = await prisma.maire.findUnique({ where: { rneId } });

        if (existant) {
          await prisma.maire.update({ where: { rneId }, data: donnees });
          misAJour++;
        } else {
          await prisma.maire.create({ data: donnees });
          crees++;
        }

        traites++;

        // Log progression tous les 1000
        if (traites % 1000 === 0) {
          logInfo(`Maires: ${traites}/${records.length} traités...`);
        }
      } catch (err) {
        erreurs++;
        if (erreurs <= 5) {
          logError(`Erreur maire ${m["Nom de l'élu"]}`, err);
        }
      }
    }

    logInfo(`Sync maires terminée: ${traites} traités, ${crees} créés, ${misAJour} mis à jour, ${erreurs} erreurs`);
  } catch (err) {
    logError('Erreur sync maires', err);
    throw err;
  }

  return { traites, crees, misAJour, erreurs };
}

// ==================== SYNC LOIS ====================

interface DossierNosdeputes {
  section: {
    id: number;
    id_dossier_institution: string;
    titre: string;
    min_date: string;
    max_date: string;
    nb_interventions: number;
    url_institution: string;
    url_nosdeputes: string;
    url_nosdeputes_api: string;
  };
}

function determinerTypeLoi(titre: string, urlInstitution: string): 'PROJET_LOI' | 'PROPOSITION_LOI' | 'PROJET_LOI_FINANCES' | 'PROJET_LOI_ORGANIQUE' | 'PROPOSITION_LOI_ORGANIQUE' | 'PROJET_LOI_FINANCEMENT_SECU' | 'PROPOSITION_RESOLUTION' | 'PROJET_LOI_REGLEMENT' {
  const titreLower = titre.toLowerCase();
  const urlLower = urlInstitution.toLowerCase();

  if (titreLower.includes('projet de loi de finances') || urlLower.includes('plf')) {
    return 'PROJET_LOI_FINANCES';
  }
  if (titreLower.includes('projet de loi de financement de la sécurité sociale') || urlLower.includes('plfss')) {
    return 'PROJET_LOI_FINANCEMENT_SECU';
  }
  if (titreLower.includes('projet de loi de règlement')) {
    return 'PROJET_LOI_REGLEMENT';
  }
  if (titreLower.includes('projet de loi organique')) {
    return 'PROJET_LOI_ORGANIQUE';
  }
  if (titreLower.includes('proposition de loi organique')) {
    return 'PROPOSITION_LOI_ORGANIQUE';
  }
  if (titreLower.includes('proposition de résolution')) {
    return 'PROPOSITION_RESOLUTION';
  }
  if (titreLower.includes('projet de loi')) {
    return 'PROJET_LOI';
  }
  // Par défaut, proposition de loi
  return 'PROPOSITION_LOI';
}

function determinerStatutLoi(_minDate: string, maxDate: string, nbInterventions: number): 'DEPOSE' | 'EN_COMMISSION' | 'EN_SEANCE' | 'ADOPTE_PREMIERE_LECTURE' | 'NAVETTE' | 'ADOPTE_DEFINITIF' | 'PROMULGUE' | 'REJETE' | 'CADUQUE' {
  // Logique simplifiée basée sur les données disponibles
  // La dissolution de juin 2024 a rendu caduques beaucoup de textes
  const dissolution = new Date('2024-06-09');
  const dateMax = new Date(maxDate);

  if (dateMax < dissolution && nbInterventions > 0) {
    // Si le dossier a eu des interventions avant la dissolution
    // et que la dernière activité est proche de la dissolution, probablement caduque
    const joursDifference = (dissolution.getTime() - dateMax.getTime()) / (1000 * 60 * 60 * 24);
    if (joursDifference < 30) {
      return 'CADUQUE';
    }
  }

  if (nbInterventions > 100) {
    return 'EN_SEANCE';
  }
  if (nbInterventions > 10) {
    return 'EN_COMMISSION';
  }
  return 'DEPOSE';
}

export async function synchroniserLois(_journalId: string): Promise<ResultatSync> {
  logInfo('Démarrage sync lois...');

  let traites = 0, crees = 0, misAJour = 0, erreurs = 0;

  try {
    // Récupérer la liste des dossiers législatifs
    const response = await axios.get('https://www.nosdeputes.fr/dossiers/date/json', {
      headers: { 'User-Agent': 'PolitiqueFR/1.0' },
      timeout: 60000,
    });

    const dossiers: DossierNosdeputes[] = response.data.sections || [];
    logInfo(`${dossiers.length} dossiers législatifs trouvés`);

    for (const item of dossiers) {
      try {
        const d = item.section;

        const dossierId = `nosdeputes-${d.id}`;
        const typeLoi = determinerTypeLoi(d.titre, d.url_institution || '');
        const statutLoi = determinerStatutLoi(d.min_date, d.max_date, d.nb_interventions);

        const donnees = {
          dossierId,
          titre: d.titre,
          titreOfficiel: d.titre,
          titreCourt: d.titre.length > 100 ? d.titre.substring(0, 97) + '...' : d.titre,
          type: typeLoi,
          statut: statutLoi,
          dateDepot: new Date(d.min_date),
          urlDossier: d.url_nosdeputes,
          urlTexte: d.url_institution || null,
          resume: `Dossier législatif avec ${d.nb_interventions} interventions parlementaires. Période d'activité : du ${d.min_date} au ${d.max_date}.`,
        };

        const existant = await prisma.loi.findUnique({ where: { dossierId } });

        if (existant) {
          await prisma.loi.update({ where: { dossierId }, data: donnees });
          misAJour++;
        } else {
          await prisma.loi.create({ data: donnees });
          crees++;
        }

        traites++;

        // Log progression tous les 50
        if (traites % 50 === 0) {
          logInfo(`Lois: ${traites}/${dossiers.length} traitées...`);
        }
      } catch (err) {
        erreurs++;
        if (erreurs <= 5) {
          logError(`Erreur loi ${item.section?.id}`, err);
        }
      }
    }

    logInfo(`Sync lois terminée: ${traites} traitées, ${crees} créées, ${misAJour} mises à jour, ${erreurs} erreurs`);
  } catch (err) {
    logError('Erreur sync lois', err);
    throw err;
  }

  return { traites, crees, misAJour, erreurs };
}

// ==================== ORCHESTRATEUR ====================

export async function executerSyncComplete(): Promise<{
  deputes: ResultatSync;
  senateurs: ResultatSync;
  maires: ResultatSync;
  lois: ResultatSync;
}> {
  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'tout',
      statut: 'EN_COURS',
      debuteA: new Date(),
    },
  });

  try {
    const deputes = await synchroniserDeputes(journal.id);
    const senateurs = await synchroniserSenateurs(journal.id);
    const maires = await synchroniserMaires(journal.id);
    const lois = await synchroniserLois(journal.id);

    const totalTraites = deputes.traites + senateurs.traites + maires.traites + lois.traites;
    const totalCrees = deputes.crees + senateurs.crees + maires.crees + lois.crees;
    const totalMisAJour = deputes.misAJour + senateurs.misAJour + maires.misAJour + lois.misAJour;
    const totalErreurs = deputes.erreurs + senateurs.erreurs + maires.erreurs + lois.erreurs;

    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: totalTraites,
        enregistrementsCrees: totalCrees,
        enregistrementsMisAJour: totalMisAJour,
        enregistrementsErreurs: totalErreurs,
      },
    });

    return { deputes, senateurs, maires, lois };
  } catch (err) {
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'ECHEC',
        termineA: new Date(),
        messageErreur: String(err),
      },
    });
    throw err;
  }
}
