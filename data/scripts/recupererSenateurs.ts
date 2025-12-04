/**
 * Script de synchronisation des sénateurs depuis l'API du Sénat
 *
 * Source: https://www.senat.fr/api-senat/senateurs.json
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const URL_API_SENAT = 'https://www.senat.fr/api-senat/senateurs.json';

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

async function recupererListeSenateurs(): Promise<SenateurApi[]> {
  console.log('📥 Récupération de la liste des sénateurs...');

  try {
    const response = await axios.get(URL_API_SENAT, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolitiqueFR/1.0',
      },
    });
    return response.data || [];
  } catch (erreur) {
    console.error('❌ Erreur lors de la récupération des sénateurs:', erreur);
    return [];
  }
}

async function trouverOuCreerGroupe(code: string, libelle: string) {
  if (!code) return null;

  const groupeExistant = await prisma.groupePolitique.findFirst({
    where: { acronyme: code, chambre: 'SENAT' },
  });

  if (groupeExistant) return groupeExistant.id;

  // Créer le groupe s'il n'existe pas
  const nouveauGroupe = await prisma.groupePolitique.create({
    data: {
      acronyme: code,
      nom: libelle || code,
      chambre: 'SENAT',
      actif: true,
      nombreMembres: 0,
    },
  });

  console.log(`   ➕ Groupe créé: ${code} - ${libelle}`);
  return nouveauGroupe.id;
}

async function synchroniserSenateurs() {
  console.log('🔄 Démarrage de la synchronisation des sénateurs...');
  const debutSync = new Date();

  // Créer une entrée de journal
  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'senateurs',
      statut: 'EN_COURS',
      debuteA: debutSync,
    },
  });

  let traites = 0;
  let crees = 0;
  let misAJour = 0;
  let erreurs = 0;

  try {
    const senateurs = await recupererListeSenateurs();
    console.log(`📊 ${senateurs.length} sénateurs trouvés`);

    for (const s of senateurs) {
      try {
        // Trouver ou créer le groupe
        const groupeId = s.groupe?.code
          ? await trouverOuCreerGroupe(s.groupe.code, s.groupe.libelle)
          : null;

        // Préparer les données
        const donnees = {
          matricule: s.matricule,
          civilite: s.civilite || (s.prenom?.endsWith('e') ? 'Mme' : 'M.'),
          prenom: s.prenom,
          nom: s.nom,
          departement: s.circonscription?.libelle || 'Non renseigné',
          codeDepartement: s.circonscription?.code?.padStart(2, '0') || '00',
          serieSenat: parseInt(s.serie) || 1,
          dateDebutMandat: new Date(), // Non disponible dans l'API, date du jour par défaut
          mandatEnCours: true,
          groupeId,
          profession: s.categorieProfessionnelle?.libelle || null,
          twitter: s.twitter || null,
          photoUrl: s.urlAvatar ? `https://www.senat.fr${s.urlAvatar}` : null,
          urlSenat: s.url ? `https://www.senat.fr${s.url}` : null,
        };

        // Upsert dans la base
        const existant = await prisma.senateur.findUnique({
          where: { matricule: s.matricule },
        });

        if (existant) {
          await prisma.senateur.update({
            where: { matricule: s.matricule },
            data: donnees,
          });
          misAJour++;
        } else {
          await prisma.senateur.create({ data: donnees });
          crees++;
        }

        traites++;

        if (traites % 50 === 0) {
          console.log(`   📝 ${traites}/${senateurs.length} sénateurs traités...`);
        }
      } catch (err) {
        erreurs++;
        console.error(`   ❌ Erreur pour ${s.matricule} (${s.nom}):`, err);
      }
    }

    // Mettre à jour le nombre de membres par groupe
    const groupes = await prisma.groupePolitique.findMany({
      where: { chambre: 'SENAT' },
    });

    for (const groupe of groupes) {
      const count = await prisma.senateur.count({
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
    console.log('✅ Synchronisation des sénateurs terminée !');
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
synchroniserSenateurs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
