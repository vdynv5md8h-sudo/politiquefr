/**
 * Script orchestrateur de synchronisation de toutes les données
 *
 * Exécute séquentiellement:
 * 1. Synchronisation des députés (nosdeputes.fr)
 * 2. Synchronisation des sénateurs (senat.fr)
 * 3. Synchronisation des maires (data.gouv.fr)
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ResultatSync {
  source: string;
  succes: boolean;
  duree: number;
  erreur?: string;
}

async function executerScript(nom: string, commande: string): Promise<ResultatSync> {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`🚀 Démarrage: ${nom}`);
  console.log('═'.repeat(60));
  console.log('');

  const debut = Date.now();

  try {
    execSync(commande, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    const duree = Math.round((Date.now() - debut) / 1000);
    console.log(`✅ ${nom} terminé en ${duree}s`);

    return { source: nom, succes: true, duree };
  } catch (erreur) {
    const duree = Math.round((Date.now() - debut) / 1000);
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    console.error(`❌ ${nom} a échoué: ${message}`);

    return { source: nom, succes: false, duree, erreur: message };
  }
}

async function synchroniserTout() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     POLITIQUEFR - SYNCHRONISATION COMPLÈTE DES DONNÉES   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Démarrage: ${new Date().toLocaleString('fr-FR')}`);

  const debutTotal = Date.now();
  const resultats: ResultatSync[] = [];

  // 1. Députés
  resultats.push(
    await executerScript(
      'Députés (nosdeputes.fr)',
      'npx tsx scripts/recupererDeputes.ts'
    )
  );

  // 2. Sénateurs
  resultats.push(
    await executerScript(
      'Sénateurs (senat.fr)',
      'npx tsx scripts/recupererSenateurs.ts'
    )
  );

  // 3. Maires
  resultats.push(
    await executerScript(
      'Maires (data.gouv.fr)',
      'npx tsx scripts/recupererMaires.ts'
    )
  );

  // Résumé final
  const dureeTotal = Math.round((Date.now() - debutTotal) / 1000);
  const succes = resultats.filter((r) => r.succes).length;
  const echecs = resultats.filter((r) => !r.succes).length;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RÉSUMÉ DE SYNCHRONISATION             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  for (const r of resultats) {
    const icone = r.succes ? '✅' : '❌';
    console.log(`${icone} ${r.source}: ${r.duree}s`);
    if (r.erreur) {
      console.log(`   └─ Erreur: ${r.erreur}`);
    }
  }

  console.log('');
  console.log('─'.repeat(60));
  console.log(`📊 Total: ${succes} réussis, ${echecs} échoués`);
  console.log(`⏱️  Durée totale: ${dureeTotal}s (${Math.round(dureeTotal / 60)}min)`);
  console.log(`📅 Fin: ${new Date().toLocaleString('fr-FR')}`);

  // Afficher les statistiques de la base
  console.log('');
  console.log('📈 État de la base de données:');

  const [nbDeputes, nbSenateurs, nbMaires, nbGroupes] = await Promise.all([
    prisma.depute.count({ where: { mandatEnCours: true } }),
    prisma.senateur.count({ where: { mandatEnCours: true } }),
    prisma.maire.count(),
    prisma.groupePolitique.count({ where: { actif: true } }),
  ]);

  console.log(`   • Députés en mandat: ${nbDeputes}`);
  console.log(`   • Sénateurs en mandat: ${nbSenateurs}`);
  console.log(`   • Maires: ${nbMaires}`);
  console.log(`   • Groupes politiques actifs: ${nbGroupes}`);
  console.log('');

  if (echecs > 0) {
    process.exit(1);
  }
}

// Exécution
synchroniserTout()
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
