/**
 * Script de synchronisation des députés depuis nosdeputes.fr
 *
 * API Documentation: https://github.com/regardscitoyens/nosdeputes.fr/blob/master/doc/api.md
 *
 * Endpoints utilisés:
 * - GET https://www.nosdeputes.fr/deputes/enmandat/json (liste des députés)
 * - GET https://www.nosdeputes.fr/{slug}/json (détail d'un député)
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration du rate limiting
const DELAI_ENTRE_REQUETES = 200; // 200ms entre chaque requête
const URL_BASE = 'https://www.nosdeputes.fr';

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
    anciens_mandats: unknown[];
    autres_mandats: unknown[];
    url_an: string;
    url_nosdeputes: string;
    url_nosdeputes_api: string;
    emails: { email: string }[];
    sites_web: { site: string }[];
    twitter: string;
  };
}

interface DeputeSynthese {
  depute: {
    id: number;
    slug: string;
    sempiternels: {
      vacances: number;
      commissions: { nb: number; pct: number };
      hemicycle: { nb: number; pct: number };
      nbitvs: number;
    };
    stats: {
      amendements_proposes: number;
      amendements_adoptes: number;
      questions_ecrites: number;
      questions_orales: number;
      rapports: number;
      propositions_ecrites: number;
      propositions_signees: number;
    };
  };
}

async function attendreDelai() {
  return new Promise((resolve) => setTimeout(resolve, DELAI_ENTRE_REQUETES));
}

async function recupererListeDeputes(): Promise<DeputeNosdeputes[]> {
  console.log('📥 Récupération de la liste des députés en mandat...');

  try {
    const response = await axios.get(`${URL_BASE}/deputes/enmandat/json`);
    return response.data.deputes || [];
  } catch (erreur) {
    console.error('❌ Erreur lors de la récupération de la liste:', erreur);
    return [];
  }
}

async function recupererSyntheseDepute(slug: string): Promise<DeputeSynthese | null> {
  try {
    const response = await axios.get(`${URL_BASE}/${slug}/synthese/json`);
    return response.data;
  } catch {
    // Certains députés n'ont pas de synthèse
    return null;
  }
}

async function trouverOuCreerGroupe(acronyme: string, nom: string) {
  if (!acronyme) return null;

  const groupeExistant = await prisma.groupePolitique.findFirst({
    where: { acronyme, chambre: 'ASSEMBLEE' },
  });

  if (groupeExistant) return groupeExistant.id;

  // Créer le groupe s'il n'existe pas
  const nouveauGroupe = await prisma.groupePolitique.create({
    data: {
      acronyme,
      nom: nom || acronyme,
      chambre: 'ASSEMBLEE',
      actif: true,
      nombreMembres: 0,
    },
  });

  return nouveauGroupe.id;
}

async function synchroniserDeputes() {
  console.log('🔄 Démarrage de la synchronisation des députés...');
  const debutSync = new Date();

  // Créer une entrée de journal
  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'deputes',
      statut: 'EN_COURS',
      debuteA: debutSync,
    },
  });

  let traites = 0;
  let crees = 0;
  let misAJour = 0;
  let erreurs = 0;

  try {
    const deputes = await recupererListeDeputes();
    console.log(`📊 ${deputes.length} députés trouvés`);

    for (const item of deputes) {
      try {
        const d = item.depute;
        await attendreDelai();

        // Récupérer les statistiques
        const synthese = await recupererSyntheseDepute(d.slug);

        // Trouver ou créer le groupe
        const groupeId = d.groupe_sigle
          ? await trouverOuCreerGroupe(d.groupe_sigle, d.groupe?.organisme)
          : null;

        // Préparer les données
        const donnees = {
          slug: d.slug,
          civilite: d.sexe === 'F' ? 'Mme' : 'M.',
          prenom: d.prenom,
          nom: d.nom_de_famille,
          dateNaissance: d.date_naissance ? new Date(d.date_naissance) : null,
          lieuNaissance: d.lieu_naissance || null,
          profession: d.profession || null,
          legislature: 17, // XVIIe législature
          numeroCirconscription: d.num_circo,
          departement: d.nom_circo,
          dateDebutMandat: new Date(d.mandat_debut),
          dateFinMandat: d.mandat_fin ? new Date(d.mandat_fin) : null,
          mandatEnCours: !d.mandat_fin,
          groupeId,
          presenceCommission: synthese?.depute.sempiternels.commissions.pct || null,
          presenceHemicycle: synthese?.depute.sempiternels.hemicycle.pct || null,
          interventions: synthese?.depute.sempiternels.nbitvs || null,
          questionsEcrites: synthese?.depute.stats.questions_ecrites || null,
          questionsOrales: synthese?.depute.stats.questions_orales || null,
          propositionsLoi: synthese?.depute.stats.propositions_ecrites || null,
          rapports: synthese?.depute.stats.rapports || null,
          amendementsProposes: synthese?.depute.stats.amendements_proposes || null,
          amendementsAdoptes: synthese?.depute.stats.amendements_adoptes || null,
          email: d.emails?.[0]?.email || null,
          twitter: d.twitter || null,
          siteWeb: d.sites_web?.[0]?.site || null,
          urlNosdeputes: d.url_nosdeputes || null,
          urlAssemblee: d.url_an || null,
          photoUrl: `https://www.nosdeputes.fr/depute/photo/${d.slug}/120`,
        };

        // Upsert dans la base
        const existant = await prisma.depute.findUnique({ where: { slug: d.slug } });

        if (existant) {
          await prisma.depute.update({
            where: { slug: d.slug },
            data: donnees,
          });
          misAJour++;
        } else {
          await prisma.depute.create({ data: donnees });
          crees++;
        }

        traites++;

        if (traites % 50 === 0) {
          console.log(`   📝 ${traites}/${deputes.length} députés traités...`);
        }
      } catch (err) {
        erreurs++;
        console.error(`   ❌ Erreur pour ${item.depute?.slug}:`, err);
      }
    }

    // Mettre à jour le nombre de membres par groupe
    const groupes = await prisma.groupePolitique.findMany({
      where: { chambre: 'ASSEMBLEE' },
    });

    for (const groupe of groupes) {
      const count = await prisma.depute.count({
        where: { groupeId: groupe.id, mandatEnCours: true },
      });
      await prisma.groupePolitique.update({
        where: { id: groupe.id },
        data: { nombreMembres: count },
      });
    }

    // Finaliser le journal
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'TERMINE',
        termineA: new Date(),
        enregistrementsTraites: traites,
        enregistrementsCrees: crees,
        enregistrementsMisAJour: misAJour,
        enregistrementsErreurs: erreurs,
      },
    });

    console.log('');
    console.log('✅ Synchronisation terminée !');
    console.log(`   📊 Traités: ${traites}`);
    console.log(`   ➕ Créés: ${crees}`);
    console.log(`   🔄 Mis à jour: ${misAJour}`);
    console.log(`   ❌ Erreurs: ${erreurs}`);
  } catch (erreur) {
    await prisma.journalSync.update({
      where: { id: journal.id },
      data: {
        statut: 'ECHEC',
        termineA: new Date(),
        messageErreur: String(erreur),
      },
    });
    throw erreur;
  }
}

// Exécution
synchroniserDeputes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
