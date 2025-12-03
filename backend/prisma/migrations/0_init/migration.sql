-- CreateEnum
CREATE TYPE "Chambre" AS ENUM ('ASSEMBLEE', 'SENAT');

-- CreateEnum
CREATE TYPE "TypeLoi" AS ENUM ('PROJET_LOI', 'PROPOSITION_LOI', 'PROJET_LOI_ORGANIQUE', 'PROPOSITION_LOI_ORGANIQUE', 'PROJET_LOI_FINANCES', 'PROJET_LOI_REGLEMENT', 'PROJET_LOI_FINANCEMENT_SECU', 'PROPOSITION_RESOLUTION');

-- CreateEnum
CREATE TYPE "StatutLoi" AS ENUM ('DEPOSE', 'EN_COMMISSION', 'EN_SEANCE', 'ADOPTE_PREMIERE_LECTURE', 'NAVETTE', 'ADOPTE_DEFINITIF', 'PROMULGUE', 'REJETE', 'RETIRE', 'CADUQUE');

-- CreateEnum
CREATE TYPE "ResultatScrutin" AS ENUM ('ADOPTE', 'REJETE');

-- CreateEnum
CREATE TYPE "PositionVote" AS ENUM ('POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT');

-- CreateEnum
CREATE TYPE "SortAmendement" AS ENUM ('ADOPTE', 'REJETE', 'RETIRE', 'TOMBE', 'IRRECEVABLE', 'NON_SOUTENU', 'EN_COURS');

-- CreateEnum
CREATE TYPE "StatutPromesse" AS ENUM ('NON_EVALUEE', 'EN_COURS', 'PARTIELLEMENT_TENUE', 'TENUE', 'NON_TENUE', 'ABANDONNEE');

-- CreateEnum
CREATE TYPE "CategorieActualite" AS ENUM ('POLITIQUE_GENERALE', 'ASSEMBLEE', 'SENAT', 'GOUVERNEMENT', 'ELECTIONS', 'AFFAIRES_JUDICIAIRES', 'CONTROVERSES', 'ECONOMIE', 'SOCIAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "StatutActualite" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeAffaire" AS ENUM ('CORRUPTION', 'ABUS_DE_CONFIANCE', 'DETOURNEMENT_FONDS', 'PRISE_ILLEGALE_INTERETS', 'EMPLOI_FICTIF', 'FRAUDE_FISCALE', 'FINANCEMENT_ILLEGAL_CAMPAGNE', 'DIFFAMATION', 'HARCELEMENT', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutAffaire" AS ENUM ('ENQUETE', 'INSTRUCTION', 'PROCES', 'CONDAMNE', 'RELAXE', 'APPEL', 'CASSATION', 'PRESCRIT', 'CLASSE_SANS_SUITE', 'NON_LIEU');

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('ADMIN', 'MODERATEUR');

-- CreateEnum
CREATE TYPE "StatutSync" AS ENUM ('EN_COURS', 'TERMINE', 'ECHEC');

-- CreateTable
CREATE TABLE "Maire" (
    "id" TEXT NOT NULL,
    "rneId" TEXT NOT NULL,
    "civilite" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "profession" TEXT,
    "codeCommune" TEXT NOT NULL,
    "libelleCommune" TEXT NOT NULL,
    "codeDepartement" TEXT NOT NULL,
    "libelleDepartement" TEXT NOT NULL,
    "codeRegion" TEXT,
    "libelleRegion" TEXT,
    "dateDebutMandat" TIMESTAMP(3) NOT NULL,
    "dateFinMandat" TIMESTAMP(3),
    "fonctionMandat" TEXT NOT NULL,
    "codeNuance" TEXT,
    "libelleNuance" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "siteWeb" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depute" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "civilite" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomUsuel" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "profession" TEXT,
    "legislature" INTEGER NOT NULL,
    "numeroCirconscription" INTEGER NOT NULL,
    "departement" TEXT NOT NULL,
    "codeDepartement" TEXT,
    "dateDebutMandat" TIMESTAMP(3) NOT NULL,
    "dateFinMandat" TIMESTAMP(3),
    "motifFin" TEXT,
    "mandatEnCours" BOOLEAN NOT NULL DEFAULT true,
    "groupeId" TEXT,
    "presenceCommission" DOUBLE PRECISION,
    "presenceHemicycle" DOUBLE PRECISION,
    "participationScrutins" DOUBLE PRECISION,
    "questionsEcrites" INTEGER,
    "questionsOrales" INTEGER,
    "propositionsLoi" INTEGER,
    "rapports" INTEGER,
    "interventions" INTEGER,
    "amendementsProposes" INTEGER,
    "amendementsAdoptes" INTEGER,
    "email" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "siteWeb" TEXT,
    "photoUrl" TEXT,
    "urlNosdeputes" TEXT,
    "urlAssemblee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Senateur" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "civilite" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "profession" TEXT,
    "departement" TEXT NOT NULL,
    "codeDepartement" TEXT NOT NULL,
    "serieSenat" INTEGER NOT NULL,
    "dateDebutMandat" TIMESTAMP(3) NOT NULL,
    "dateFinMandat" TIMESTAMP(3),
    "typeElection" TEXT,
    "mandatEnCours" BOOLEAN NOT NULL DEFAULT true,
    "groupeId" TEXT,
    "presenceCommission" DOUBLE PRECISION,
    "presenceSeance" DOUBLE PRECISION,
    "questionsEcrites" INTEGER,
    "questionsOrales" INTEGER,
    "propositionsLoi" INTEGER,
    "rapports" INTEGER,
    "email" TEXT,
    "twitter" TEXT,
    "siteWeb" TEXT,
    "photoUrl" TEXT,
    "urlSenat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Senateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupePolitique" (
    "id" TEXT NOT NULL,
    "acronyme" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chambre" "Chambre" NOT NULL,
    "ideologie" TEXT,
    "positionPolitique" TEXT,
    "description" TEXT,
    "couleur" TEXT,
    "nombreMembres" INTEGER NOT NULL DEFAULT 0,
    "siteWeb" TEXT,
    "logoUrl" TEXT,
    "dateCreation" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupePolitique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loi" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "titreOfficiel" TEXT,
    "titreCourt" TEXT,
    "type" "TypeLoi" NOT NULL,
    "statut" "StatutLoi" NOT NULL,
    "dateDepot" TIMESTAMP(3) NOT NULL,
    "dateAdoption" TIMESTAMP(3),
    "datePromulgation" TIMESTAMP(3),
    "numeroJo" TEXT,
    "resume" TEXT,
    "exposeDesMotifs" TEXT,
    "urlDossier" TEXT,
    "urlTexte" TEXT,
    "auteurs" TEXT,
    "rapporteurs" TEXT,
    "themeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeLoi" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "ThemeLoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scrutin" (
    "id" TEXT NOT NULL,
    "numeroScrutin" INTEGER NOT NULL,
    "chambre" "Chambre" NOT NULL,
    "legislature" INTEGER,
    "dateScrutin" TIMESTAMP(3) NOT NULL,
    "seance" TEXT,
    "titre" TEXT NOT NULL,
    "objet" TEXT,
    "loiId" TEXT,
    "nombreVotants" INTEGER NOT NULL,
    "nombreSuffrages" INTEGER NOT NULL,
    "majoriteAbsolue" INTEGER NOT NULL,
    "pour" INTEGER NOT NULL,
    "contre" INTEGER NOT NULL,
    "abstention" INTEGER NOT NULL,
    "resultat" "ResultatScrutin" NOT NULL,
    "urlScrutin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scrutin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteDepute" (
    "id" TEXT NOT NULL,
    "deputeId" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "position" "PositionVote" NOT NULL,
    "parDelegation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteDepute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSenateur" (
    "id" TEXT NOT NULL,
    "senateurId" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "position" "PositionVote" NOT NULL,
    "parDelegation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteSenateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amendement" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "chambre" "Chambre" NOT NULL,
    "loiId" TEXT NOT NULL,
    "dispositif" TEXT,
    "exposeSommaire" TEXT,
    "auteurs" TEXT NOT NULL,
    "sort" "SortAmendement" NOT NULL,
    "dateDepot" TIMESTAMP(3) NOT NULL,
    "dateDiscussion" TIMESTAMP(3),
    "urlAmendement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amendement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promesse" (
    "id" TEXT NOT NULL,
    "maireId" TEXT,
    "deputeId" TEXT,
    "senateurId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "datePromesse" TIMESTAMP(3),
    "statut" "StatutPromesse" NOT NULL DEFAULT 'NON_EVALUEE',
    "evaluation" TEXT,
    "dateEvaluation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promesse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleActualite" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "resume" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "auteur" TEXT,
    "guidSource" TEXT,
    "categorie" "CategorieActualite" NOT NULL,
    "tags" TEXT,
    "statut" "StatutActualite" NOT NULL DEFAULT 'EN_ATTENTE',
    "modereePar" TEXT,
    "modereeA" TIMESTAMP(3),
    "noteModeration" TEXT,
    "datePublication" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleActualite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffaireJudiciaire" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "personnes" TEXT NOT NULL,
    "type" "TypeAffaire" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateJugement" TIMESTAMP(3),
    "statut" "StatutAffaire" NOT NULL,
    "juridiction" TEXT,
    "reference" TEXT,
    "derniereActualite" TEXT,
    "dateActualite" TIMESTAMP(3),
    "sources" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffaireJudiciaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'MODERATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereConnexion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAudit" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "typeEntite" TEXT NOT NULL,
    "entiteId" TEXT,
    "details" TEXT,
    "adresseIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalSync" (
    "id" TEXT NOT NULL,
    "typeDonnees" TEXT NOT NULL,
    "statut" "StatutSync" NOT NULL,
    "debuteA" TIMESTAMP(3) NOT NULL,
    "termineA" TIMESTAMP(3),
    "enregistrementsTraites" INTEGER NOT NULL DEFAULT 0,
    "enregistrementsCrees" INTEGER NOT NULL DEFAULT 0,
    "enregistrementsMisAJour" INTEGER NOT NULL DEFAULT 0,
    "enregistrementsErreurs" INTEGER NOT NULL DEFAULT 0,
    "messageErreur" TEXT,

    CONSTRAINT "JournalSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Maire_rneId_key" ON "Maire"("rneId");

-- CreateIndex
CREATE INDEX "Maire_codeDepartement_idx" ON "Maire"("codeDepartement");

-- CreateIndex
CREATE INDEX "Maire_codeCommune_idx" ON "Maire"("codeCommune");

-- CreateIndex
CREATE INDEX "Maire_nom_prenom_idx" ON "Maire"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Maire_codeNuance_idx" ON "Maire"("codeNuance");

-- CreateIndex
CREATE UNIQUE INDEX "Depute_slug_key" ON "Depute"("slug");

-- CreateIndex
CREATE INDEX "Depute_groupeId_idx" ON "Depute"("groupeId");

-- CreateIndex
CREATE INDEX "Depute_departement_idx" ON "Depute"("departement");

-- CreateIndex
CREATE INDEX "Depute_codeDepartement_idx" ON "Depute"("codeDepartement");

-- CreateIndex
CREATE INDEX "Depute_legislature_idx" ON "Depute"("legislature");

-- CreateIndex
CREATE INDEX "Depute_nom_prenom_idx" ON "Depute"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Depute_mandatEnCours_idx" ON "Depute"("mandatEnCours");

-- CreateIndex
CREATE UNIQUE INDEX "Senateur_matricule_key" ON "Senateur"("matricule");

-- CreateIndex
CREATE INDEX "Senateur_groupeId_idx" ON "Senateur"("groupeId");

-- CreateIndex
CREATE INDEX "Senateur_codeDepartement_idx" ON "Senateur"("codeDepartement");

-- CreateIndex
CREATE INDEX "Senateur_nom_prenom_idx" ON "Senateur"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Senateur_mandatEnCours_idx" ON "Senateur"("mandatEnCours");

-- CreateIndex
CREATE INDEX "GroupePolitique_chambre_idx" ON "GroupePolitique"("chambre");

-- CreateIndex
CREATE INDEX "GroupePolitique_actif_idx" ON "GroupePolitique"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "GroupePolitique_acronyme_chambre_key" ON "GroupePolitique"("acronyme", "chambre");

-- CreateIndex
CREATE UNIQUE INDEX "Loi_dossierId_key" ON "Loi"("dossierId");

-- CreateIndex
CREATE INDEX "Loi_statut_idx" ON "Loi"("statut");

-- CreateIndex
CREATE INDEX "Loi_type_idx" ON "Loi"("type");

-- CreateIndex
CREATE INDEX "Loi_dateDepot_idx" ON "Loi"("dateDepot");

-- CreateIndex
CREATE INDEX "Loi_themeId_idx" ON "Loi"("themeId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeLoi_nom_key" ON "ThemeLoi"("nom");

-- CreateIndex
CREATE INDEX "Scrutin_dateScrutin_idx" ON "Scrutin"("dateScrutin");

-- CreateIndex
CREATE INDEX "Scrutin_loiId_idx" ON "Scrutin"("loiId");

-- CreateIndex
CREATE INDEX "Scrutin_chambre_idx" ON "Scrutin"("chambre");

-- CreateIndex
CREATE UNIQUE INDEX "Scrutin_numeroScrutin_chambre_legislature_key" ON "Scrutin"("numeroScrutin", "chambre", "legislature");

-- CreateIndex
CREATE INDEX "VoteDepute_scrutinId_idx" ON "VoteDepute"("scrutinId");

-- CreateIndex
CREATE INDEX "VoteDepute_position_idx" ON "VoteDepute"("position");

-- CreateIndex
CREATE UNIQUE INDEX "VoteDepute_deputeId_scrutinId_key" ON "VoteDepute"("deputeId", "scrutinId");

-- CreateIndex
CREATE INDEX "VoteSenateur_scrutinId_idx" ON "VoteSenateur"("scrutinId");

-- CreateIndex
CREATE INDEX "VoteSenateur_position_idx" ON "VoteSenateur"("position");

-- CreateIndex
CREATE UNIQUE INDEX "VoteSenateur_senateurId_scrutinId_key" ON "VoteSenateur"("senateurId", "scrutinId");

-- CreateIndex
CREATE INDEX "Amendement_loiId_idx" ON "Amendement"("loiId");

-- CreateIndex
CREATE INDEX "Amendement_dateDepot_idx" ON "Amendement"("dateDepot");

-- CreateIndex
CREATE INDEX "Amendement_sort_idx" ON "Amendement"("sort");

-- CreateIndex
CREATE INDEX "Promesse_maireId_idx" ON "Promesse"("maireId");

-- CreateIndex
CREATE INDEX "Promesse_deputeId_idx" ON "Promesse"("deputeId");

-- CreateIndex
CREATE INDEX "Promesse_senateurId_idx" ON "Promesse"("senateurId");

-- CreateIndex
CREATE INDEX "Promesse_statut_idx" ON "Promesse"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleActualite_guidSource_key" ON "ArticleActualite"("guidSource");

-- CreateIndex
CREATE INDEX "ArticleActualite_categorie_idx" ON "ArticleActualite"("categorie");

-- CreateIndex
CREATE INDEX "ArticleActualite_statut_idx" ON "ArticleActualite"("statut");

-- CreateIndex
CREATE INDEX "ArticleActualite_datePublication_idx" ON "ArticleActualite"("datePublication");

-- CreateIndex
CREATE INDEX "AffaireJudiciaire_statut_idx" ON "AffaireJudiciaire"("statut");

-- CreateIndex
CREATE INDEX "AffaireJudiciaire_type_idx" ON "AffaireJudiciaire"("type");

-- CreateIndex
CREATE INDEX "AffaireJudiciaire_dateDebut_idx" ON "AffaireJudiciaire"("dateDebut");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE INDEX "JournalAudit_utilisateurId_idx" ON "JournalAudit"("utilisateurId");

-- CreateIndex
CREATE INDEX "JournalAudit_typeEntite_entiteId_idx" ON "JournalAudit"("typeEntite", "entiteId");

-- CreateIndex
CREATE INDEX "JournalAudit_createdAt_idx" ON "JournalAudit"("createdAt");

-- CreateIndex
CREATE INDEX "JournalSync_typeDonnees_idx" ON "JournalSync"("typeDonnees");

-- CreateIndex
CREATE INDEX "JournalSync_debuteA_idx" ON "JournalSync"("debuteA");

-- CreateIndex
CREATE INDEX "JournalSync_statut_idx" ON "JournalSync"("statut");

-- AddForeignKey
ALTER TABLE "Depute" ADD CONSTRAINT "Depute_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "GroupePolitique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senateur" ADD CONSTRAINT "Senateur_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "GroupePolitique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loi" ADD CONSTRAINT "Loi_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ThemeLoi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrutin" ADD CONSTRAINT "Scrutin_loiId_fkey" FOREIGN KEY ("loiId") REFERENCES "Loi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteDepute" ADD CONSTRAINT "VoteDepute_deputeId_fkey" FOREIGN KEY ("deputeId") REFERENCES "Depute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteDepute" ADD CONSTRAINT "VoteDepute_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSenateur" ADD CONSTRAINT "VoteSenateur_senateurId_fkey" FOREIGN KEY ("senateurId") REFERENCES "Senateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSenateur" ADD CONSTRAINT "VoteSenateur_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendement" ADD CONSTRAINT "Amendement_loiId_fkey" FOREIGN KEY ("loiId") REFERENCES "Loi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promesse" ADD CONSTRAINT "Promesse_maireId_fkey" FOREIGN KEY ("maireId") REFERENCES "Maire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promesse" ADD CONSTRAINT "Promesse_deputeId_fkey" FOREIGN KEY ("deputeId") REFERENCES "Depute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promesse" ADD CONSTRAINT "Promesse_senateurId_fkey" FOREIGN KEY ("senateurId") REFERENCES "Senateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAudit" ADD CONSTRAINT "JournalAudit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
