import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // ========== GROUPES POLITIQUES ==========
  console.log('📊 Création des groupes politiques...');

  const groupesAssemblee = [
    {
      acronyme: 'RN',
      nom: 'Rassemblement National',
      chambre: 'ASSEMBLEE' as const,
      ideologie: 'Nationalisme, Souverainisme, Euroscepticisme',
      positionPolitique: 'Droite',
      couleur: '#0D378A',
      nombreMembres: 125,
      description: 'Groupe parlementaire du Rassemblement National à l\'Assemblée nationale.',
    },
    {
      acronyme: 'EPR',
      nom: 'Ensemble pour la République',
      chambre: 'ASSEMBLEE' as const,
      ideologie: 'Libéralisme, Pro-européanisme, Centrisme',
      positionPolitique: 'Centre',
      couleur: '#FFEB00',
      nombreMembres: 166,
      description: 'Coalition macroniste regroupant Renaissance, Horizons et le MoDem.',
    },
    {
      acronyme: 'LFI',
      nom: 'La France Insoumise - NUPES',
      chambre: 'ASSEMBLEE' as const,
      ideologie: 'Socialisme démocratique, Écologie politique',
      positionPolitique: 'Gauche',
      couleur: '#CC2443',
      nombreMembres: 72,
      description: 'Mouvement politique fondé par Jean-Luc Mélenchon.',
    },
    {
      acronyme: 'SOC',
      nom: 'Socialistes et apparentés',
      chambre: 'ASSEMBLEE' as const,
      ideologie: 'Social-démocratie, Pro-européanisme',
      positionPolitique: 'Centre-Gauche',
      couleur: '#FF8080',
      nombreMembres: 66,
      description: 'Groupe du Parti socialiste à l\'Assemblée nationale.',
    },
    {
      acronyme: 'LR',
      nom: 'Les Républicains',
      chambre: 'ASSEMBLEE' as const,
      ideologie: 'Conservatisme, Gaullisme, Libéralisme économique',
      positionPolitique: 'Droite',
      couleur: '#0066CC',
      nombreMembres: 47,
      description: 'Principal parti de la droite républicaine.',
    },
  ];

  const groupesSenat = [
    {
      acronyme: 'LR',
      nom: 'Les Républicains',
      chambre: 'SENAT' as const,
      ideologie: 'Conservatisme, Gaullisme',
      positionPolitique: 'Droite',
      couleur: '#0066CC',
      nombreMembres: 133,
      description: 'Principal groupe de droite au Sénat.',
    },
    {
      acronyme: 'SER',
      nom: 'Socialiste, Écologiste et Républicain',
      chambre: 'SENAT' as const,
      ideologie: 'Social-démocratie, Écologie politique',
      positionPolitique: 'Gauche',
      couleur: '#FF8080',
      nombreMembres: 64,
      description: 'Groupe de la gauche socialiste et écologiste au Sénat.',
    },
    {
      acronyme: 'UC',
      nom: 'Union Centriste',
      chambre: 'SENAT' as const,
      ideologie: 'Centrisme, Démocratie chrétienne',
      positionPolitique: 'Centre',
      couleur: '#FFA500',
      nombreMembres: 56,
      description: 'Groupe centriste au Sénat.',
    },
  ];

  const tousGroupes = [...groupesAssemblee, ...groupesSenat];

  for (const groupe of tousGroupes) {
    await prisma.groupePolitique.upsert({
      where: {
        acronyme_chambre: {
          acronyme: groupe.acronyme,
          chambre: groupe.chambre,
        },
      },
      update: groupe,
      create: groupe,
    });
  }

  // Récupérer les IDs des groupes créés
  const groupeRN = await prisma.groupePolitique.findFirst({ where: { acronyme: 'RN', chambre: 'ASSEMBLEE' } });
  const groupeEPR = await prisma.groupePolitique.findFirst({ where: { acronyme: 'EPR', chambre: 'ASSEMBLEE' } });
  const groupeLFI = await prisma.groupePolitique.findFirst({ where: { acronyme: 'LFI', chambre: 'ASSEMBLEE' } });
  const groupeSOC = await prisma.groupePolitique.findFirst({ where: { acronyme: 'SOC', chambre: 'ASSEMBLEE' } });
  const groupeLR = await prisma.groupePolitique.findFirst({ where: { acronyme: 'LR', chambre: 'ASSEMBLEE' } });
  const groupeSenatLR = await prisma.groupePolitique.findFirst({ where: { acronyme: 'LR', chambre: 'SENAT' } });
  const groupeSenatSER = await prisma.groupePolitique.findFirst({ where: { acronyme: 'SER', chambre: 'SENAT' } });

  // ========== DÉPUTÉS ==========
  console.log('👔 Création des députés...');

  const deputes = [
    {
      slug: 'yael-braun-pivet',
      civilite: 'Mme',
      prenom: 'Yaël',
      nom: 'Braun-Pivet',
      legislature: 17,
      numeroCirconscription: 5,
      departement: 'Yvelines',
      codeDepartement: '78',
      dateDebutMandat: new Date('2024-07-08'),
      mandatEnCours: true,
      groupeId: groupeEPR?.id,
      presenceCommission: 78.5,
      presenceHemicycle: 42.3,
      participationScrutins: 65.2,
      questionsEcrites: 12,
      questionsOrales: 3,
      propositionsLoi: 2,
      rapports: 1,
      interventions: 156,
      profession: 'Magistrat',
      photoUrl: 'https://www.nosdeputes.fr/depute/photo/yael-braun-pivet/120',
    },
    {
      slug: 'marine-le-pen',
      civilite: 'Mme',
      prenom: 'Marine',
      nom: 'Le Pen',
      legislature: 17,
      numeroCirconscription: 11,
      departement: 'Pas-de-Calais',
      codeDepartement: '62',
      dateDebutMandat: new Date('2024-07-08'),
      mandatEnCours: true,
      groupeId: groupeRN?.id,
      presenceCommission: 45.0,
      presenceHemicycle: 38.2,
      participationScrutins: 72.5,
      questionsEcrites: 8,
      questionsOrales: 5,
      propositionsLoi: 4,
      rapports: 0,
      interventions: 89,
      profession: 'Avocate',
      photoUrl: 'https://www.nosdeputes.fr/depute/photo/marine-le-pen/120',
    },
    {
      slug: 'jean-luc-melenchon',
      civilite: 'M.',
      prenom: 'Jean-Luc',
      nom: 'Mélenchon',
      legislature: 17,
      numeroCirconscription: 4,
      departement: 'Bouches-du-Rhône',
      codeDepartement: '13',
      dateDebutMandat: new Date('2024-07-08'),
      mandatEnCours: true,
      groupeId: groupeLFI?.id,
      presenceCommission: 35.0,
      presenceHemicycle: 28.5,
      participationScrutins: 55.8,
      questionsEcrites: 5,
      questionsOrales: 12,
      propositionsLoi: 8,
      rapports: 0,
      interventions: 245,
      profession: 'Professeur',
      photoUrl: 'https://www.nosdeputes.fr/depute/photo/jean-luc-melenchon/120',
    },
    {
      slug: 'olivier-faure',
      civilite: 'M.',
      prenom: 'Olivier',
      nom: 'Faure',
      legislature: 17,
      numeroCirconscription: 11,
      departement: 'Seine-et-Marne',
      codeDepartement: '77',
      dateDebutMandat: new Date('2024-07-08'),
      mandatEnCours: true,
      groupeId: groupeSOC?.id,
      presenceCommission: 62.0,
      presenceHemicycle: 55.3,
      participationScrutins: 78.2,
      questionsEcrites: 15,
      questionsOrales: 8,
      propositionsLoi: 6,
      rapports: 2,
      interventions: 178,
      profession: 'Journaliste',
      photoUrl: 'https://www.nosdeputes.fr/depute/photo/olivier-faure/120',
    },
    {
      slug: 'eric-ciotti',
      civilite: 'M.',
      prenom: 'Éric',
      nom: 'Ciotti',
      legislature: 17,
      numeroCirconscription: 1,
      departement: 'Alpes-Maritimes',
      codeDepartement: '06',
      dateDebutMandat: new Date('2024-07-08'),
      mandatEnCours: true,
      groupeId: groupeRN?.id, // A rejoint le RN
      presenceCommission: 55.0,
      presenceHemicycle: 48.7,
      participationScrutins: 82.1,
      questionsEcrites: 22,
      questionsOrales: 6,
      propositionsLoi: 12,
      rapports: 3,
      interventions: 134,
      profession: 'Fonctionnaire territorial',
      photoUrl: 'https://www.nosdeputes.fr/depute/photo/eric-ciotti/120',
    },
  ];

  for (const depute of deputes) {
    await prisma.depute.upsert({
      where: { slug: depute.slug },
      update: depute,
      create: depute,
    });
  }

  // ========== MAIRES ==========
  console.log('🏛️ Création des maires...');

  const maires = [
    {
      rneId: 'M001-PARIS',
      civilite: 'Mme',
      prenom: 'Anne',
      nom: 'Hidalgo',
      codeCommune: '75056',
      libelleCommune: 'Paris',
      codeDepartement: '75',
      libelleDepartement: 'Paris',
      codeRegion: '11',
      libelleRegion: 'Île-de-France',
      dateDebutMandat: new Date('2020-06-28'),
      fonctionMandat: 'Maire',
      codeNuance: 'SOC',
      libelleNuance: 'Parti socialiste',
      profession: 'Haut fonctionnaire',
    },
    {
      rneId: 'M002-MARSEILLE',
      civilite: 'M.',
      prenom: 'Benoît',
      nom: 'Payan',
      codeCommune: '13055',
      libelleCommune: 'Marseille',
      codeDepartement: '13',
      libelleDepartement: 'Bouches-du-Rhône',
      codeRegion: '93',
      libelleRegion: 'Provence-Alpes-Côte d\'Azur',
      dateDebutMandat: new Date('2020-12-21'),
      fonctionMandat: 'Maire',
      codeNuance: 'SOC',
      libelleNuance: 'Parti socialiste',
      profession: 'Professeur des universités',
    },
    {
      rneId: 'M003-LYON',
      civilite: 'M.',
      prenom: 'Grégory',
      nom: 'Doucet',
      codeCommune: '69123',
      libelleCommune: 'Lyon',
      codeDepartement: '69',
      libelleDepartement: 'Rhône',
      codeRegion: '84',
      libelleRegion: 'Auvergne-Rhône-Alpes',
      dateDebutMandat: new Date('2020-07-04'),
      fonctionMandat: 'Maire',
      codeNuance: 'ECO',
      libelleNuance: 'Europe Écologie Les Verts',
      profession: 'Ingénieur',
    },
  ];

  for (const maire of maires) {
    await prisma.maire.upsert({
      where: { rneId: maire.rneId },
      update: maire,
      create: maire,
    });
  }

  // ========== LOIS ==========
  console.log('📜 Création des lois...');

  // Créer d'abord les thèmes
  const themeFinances = await prisma.themeLoi.upsert({
    where: { nom: 'Finances publiques' },
    update: {},
    create: { nom: 'Finances publiques' },
  });

  const themeSocial = await prisma.themeLoi.upsert({
    where: { nom: 'Affaires sociales' },
    update: {},
    create: { nom: 'Affaires sociales' },
  });

  const lois = [
    {
      dossierId: 'DLR5L17N50000-PLF2025',
      titre: 'Projet de loi de finances pour 2025',
      titreOfficiel: 'Projet de loi de finances pour 2025',
      titreCourt: 'PLF 2025',
      type: 'PROJET_LOI_FINANCES' as const,
      statut: 'EN_SEANCE' as const,
      dateDepot: new Date('2024-10-10'),
      resume: 'Le projet de loi de finances pour 2025 fixe les recettes et les dépenses de l\'État pour l\'année à venir.',
      themeId: themeFinances.id,
      urlDossier: 'https://www.assemblee-nationale.fr/dyn/17/dossiers/projet_loi_finances_2025',
    },
    {
      dossierId: 'DLR5L17N50001-DISCRIM',
      titre: 'Proposition de loi visant à renforcer la lutte contre les discriminations',
      type: 'PROPOSITION_LOI' as const,
      statut: 'EN_COMMISSION' as const,
      dateDepot: new Date('2024-11-15'),
      resume: 'Cette proposition vise à renforcer les sanctions contre les discriminations à l\'embauche.',
      themeId: themeSocial.id,
    },
  ];

  for (const loi of lois) {
    await prisma.loi.upsert({
      where: { dossierId: loi.dossierId },
      update: loi,
      create: loi,
    });
  }

  // ========== UTILISATEUR ADMIN ==========
  console.log('👤 Création de l\'utilisateur admin...');

  const motDePasseHash = await bcrypt.hash('admin123456', 12);

  await prisma.utilisateur.upsert({
    where: { email: 'admin@politiquefr.fr' },
    update: {},
    create: {
      email: 'admin@politiquefr.fr',
      nom: 'Administrateur',
      motDePasseHash,
      role: 'ADMIN',
      actif: true,
    },
  });

  console.log('✅ Seeding terminé avec succès !');
  console.log('');
  console.log('📧 Compte admin créé :');
  console.log('   Email: admin@politiquefr.fr');
  console.log('   Mot de passe: admin123456');
  console.log('   ⚠️  Changez ce mot de passe en production !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
