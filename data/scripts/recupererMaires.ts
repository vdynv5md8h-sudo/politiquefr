/**
 * Script de synchronisation des maires depuis data.gouv.fr
 *
 * Source: Répertoire National des Élus (RNE)
 * URL: https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus-1/
 *
 * Fichier CSV des maires:
 * https://www.data.gouv.fr/fr/datasets/r/2876a346-d50c-4911-934e-19ee07b0e503
 */

import axios from 'axios';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const URL_CSV_MAIRES = 'https://www.data.gouv.fr/fr/datasets/r/2876a346-d50c-4911-934e-19ee07b0e503';

// Structure du CSV RNE (colonnes séparées par ;)
interface MaireCsv {
  'Code du département': string;
  'Libellé du département': string;
  'Code de la commune': string;
  'Libellé de la commune': string;
  'Nom de l\'élu': string;
  'Prénom de l\'élu': string;
  'Code sexe': string;
  'Date de naissance': string;
  'Code de la catégorie socio-professionnelle': string;
  'Libellé de la catégorie socio-professionnelle': string;
  'Date de début du mandat': string;
  'Date de début de la fonction': string;
}

/**
 * Génère un ID unique pour un maire basé sur sa commune et son identité
 */
function genererRneId(codeCommune: string, nom: string, prenom: string): string {
  const nomNormalise = nom.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const prenomNormalise = prenom.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${codeCommune}-${nomNormalise}-${prenomNormalise}`;
}

/**
 * Parse une date au format français DD/MM/YYYY
 */
function parseDateFr(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const jour = parseInt(parts[0], 10);
  const mois = parseInt(parts[1], 10) - 1; // Mois 0-indexed
  const annee = parseInt(parts[2], 10);

  if (isNaN(jour) || isNaN(mois) || isNaN(annee)) return null;

  return new Date(annee, mois, jour);
}

/**
 * Télécharge et parse le CSV des maires
 */
async function telechargerCsvMaires(): Promise<MaireCsv[]> {
  console.log('📥 Téléchargement du CSV des maires depuis data.gouv.fr...');

  try {
    const response = await axios.get(URL_CSV_MAIRES, {
      responseType: 'text',
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'PolitiqueFR/1.0',
      },
    });

    console.log('📄 Parsing du CSV...');

    return new Promise((resolve, reject) => {
      const records: MaireCsv[] = [];

      const parser = parse(response.data, {
        delimiter: ';',
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true, // Gérer le BOM UTF-8
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(records);
      });
    });
  } catch (erreur) {
    console.error('❌ Erreur lors du téléchargement du CSV:', erreur);
    return [];
  }
}

/**
 * Synchronise les maires dans la base de données
 */
async function synchroniserMaires() {
  console.log('🔄 Démarrage de la synchronisation des maires...');
  const debutSync = new Date();

  // Créer une entrée de journal
  const journal = await prisma.journalSync.create({
    data: {
      typeDonnees: 'maires',
      statut: 'EN_COURS',
      debuteA: debutSync,
    },
  });

  let traites = 0;
  let crees = 0;
  let misAJour = 0;
  let erreurs = 0;

  try {
    const maires = await telechargerCsvMaires();
    console.log(`📊 ${maires.length} maires trouvés dans le CSV`);

    // Traitement par lots pour éviter de surcharger la base
    const TAILLE_LOT = 500;

    for (let i = 0; i < maires.length; i += TAILLE_LOT) {
      const lot = maires.slice(i, i + TAILLE_LOT);

      for (const m of lot) {
        try {
          const nom = m["Nom de l'élu"] || '';
          const prenom = m["Prénom de l'élu"] || '';
          const codeCommune = m['Code de la commune'] || '';

          // Ignorer les lignes sans données essentielles
          if (!nom || !prenom || !codeCommune) {
            continue;
          }

          const rneId = genererRneId(codeCommune, nom, prenom);
          const codeDepartement = m['Code du département']?.padStart(2, '0') || '00';

          // Préparer les données
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

          // Upsert dans la base
          const existant = await prisma.maire.findUnique({
            where: { rneId },
          });

          if (existant) {
            await prisma.maire.update({
              where: { rneId },
              data: donnees,
            });
            misAJour++;
          } else {
            await prisma.maire.create({ data: donnees });
            crees++;
          }

          traites++;
        } catch (err) {
          erreurs++;
          const erreurMessage = err instanceof Error ? err.message : String(err);
          if (erreurs <= 5) {
            console.error(`   ❌ Erreur pour ${m["Nom de l'élu"]} (${m['Libellé de la commune']}):`, erreurMessage);
          }
        }
      }

      // Log de progression
      console.log(`   📝 ${Math.min(i + TAILLE_LOT, maires.length)}/${maires.length} maires traités...`);
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
    console.log('✅ Synchronisation des maires terminée !');
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
synchroniserMaires()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
