-- CreateEnum
CREATE TYPE "TypeDocumentParlement" AS ENUM ('PROJET_LOI', 'PROPOSITION_LOI', 'PROJET_LOI_ORGANIQUE', 'PROPOSITION_LOI_ORGANIQUE', 'PROJET_LOI_FINANCES', 'PROJET_LOI_REGLEMENT', 'PROJET_LOI_FINANCEMENT_SECU', 'PROPOSITION_RESOLUTION', 'TEXTE_ADOPTE', 'RAPPORT', 'RAPPORT_INFORMATION', 'AVIS', 'COMPTE_RENDU');

-- CreateEnum
CREATE TYPE "StatutExamenTravaux" AS ENUM ('EN_ATTENTE', 'EN_COMMISSION', 'EN_SEANCE', 'PREMIERE_LECTURE_AN', 'PREMIERE_LECTURE_SENAT', 'DEUXIEME_LECTURE', 'CMP', 'LECTURE_DEFINITIVE', 'ADOPTE', 'PROMULGUE', 'REJETE', 'RETIRE', 'CADUQUE');

-- CreateEnum
CREATE TYPE "TypeCommission" AS ENUM ('PERMANENTE', 'SPECIALE', 'ENQUETE', 'AD_HOC', 'MIXTE_PARITAIRE');

-- CreateEnum
CREATE TYPE "StatutCommissionEnquete" AS ENUM ('EN_COURS', 'TERMINE', 'RAPPORT_DEPOSE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeResume" AS ENUM ('COURT', 'MOYEN', 'LONG', 'POINTS_CLES', 'VULGARISE');

-- AlterTable
ALTER TABLE "Depute" ADD COLUMN "acteurUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Depute_acteurUid_key" ON "Depute"("acteurUid");

-- CreateTable
CREATE TABLE "ThemeTravaux" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couleur" TEXT,
    "icone" TEXT,
    "parentId" TEXT,
    "motsCles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeTravaux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemeTravaux_code_key" ON "ThemeTravaux"("code");

-- CreateIndex
CREATE INDEX "ThemeTravaux_parentId_idx" ON "ThemeTravaux"("parentId");

-- CreateIndex
CREATE INDEX "ThemeTravaux_code_idx" ON "ThemeTravaux"("code");

-- CreateTable
CREATE TABLE "CommissionParlementaire" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomCourt" TEXT,
    "typeCommission" "TypeCommission" NOT NULL,
    "chambre" "Chambre" NOT NULL,
    "legislature" INTEGER NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "presidentId" TEXT,
    "vicePresidents" TEXT,
    "secretaires" TEXT,
    "urlCommission" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionParlementaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionParlementaire_uid_key" ON "CommissionParlementaire"("uid");

-- CreateIndex
CREATE INDEX "CommissionParlementaire_typeCommission_idx" ON "CommissionParlementaire"("typeCommission");

-- CreateIndex
CREATE INDEX "CommissionParlementaire_chambre_idx" ON "CommissionParlementaire"("chambre");

-- CreateIndex
CREATE INDEX "CommissionParlementaire_legislature_idx" ON "CommissionParlementaire"("legislature");

-- CreateTable
CREATE TABLE "TravauxParlementaire" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "typeDocument" "TypeDocumentParlement" NOT NULL,
    "titre" TEXT NOT NULL,
    "titreOfficiel" TEXT,
    "titreCourt" TEXT,
    "legislature" INTEGER NOT NULL,
    "dateDepot" TIMESTAMP(3) NOT NULL,
    "dateExamen" TIMESTAMP(3),
    "dateAdoption" TIMESTAMP(3),
    "datePromulgation" TIMESTAMP(3),
    "chambreOrigine" "Chambre" NOT NULL,
    "statutExamen" "StatutExamenTravaux" NOT NULL DEFAULT 'EN_ATTENTE',
    "exposeSommaire" TEXT,
    "urlDocumentPdf" TEXT,
    "urlDossierAN" TEXT,
    "urlDossierSenat" TEXT,
    "auteurs" TEXT,
    "commissionId" TEXT,
    "themeId" TEXT,
    "rubriques" TEXT,
    "loiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravauxParlementaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravauxParlementaire_uid_key" ON "TravauxParlementaire"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "TravauxParlementaire_loiId_key" ON "TravauxParlementaire"("loiId");

-- CreateIndex
CREATE INDEX "TravauxParlementaire_typeDocument_idx" ON "TravauxParlementaire"("typeDocument");

-- CreateIndex
CREATE INDEX "TravauxParlementaire_legislature_idx" ON "TravauxParlementaire"("legislature");

-- CreateIndex
CREATE INDEX "TravauxParlementaire_statutExamen_idx" ON "TravauxParlementaire"("statutExamen");

-- CreateIndex
CREATE INDEX "TravauxParlementaire_dateDepot_idx" ON "TravauxParlementaire"("dateDepot");

-- CreateIndex
CREATE INDEX "TravauxParlementaire_themeId_idx" ON "TravauxParlementaire"("themeId");

-- CreateIndex
CREATE INDEX "TravauxParlementaire_commissionId_idx" ON "TravauxParlementaire"("commissionId");

-- CreateTable
CREATE TABLE "CommissionEnquete" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "legislature" INTEGER NOT NULL,
    "chambre" "Chambre" NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "dureeInitialeMois" INTEGER NOT NULL DEFAULT 6,
    "prolongations" INTEGER NOT NULL DEFAULT 0,
    "presidentNom" TEXT,
    "rapporteurNom" TEXT,
    "nombreMembres" INTEGER,
    "commissionId" TEXT,
    "statut" "StatutCommissionEnquete" NOT NULL DEFAULT 'EN_COURS',
    "urlRapportFinal" TEXT,
    "urlVideos" TEXT,
    "urlCompteRendus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionEnquete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionEnquete_uid_key" ON "CommissionEnquete"("uid");

-- CreateIndex
CREATE INDEX "CommissionEnquete_legislature_idx" ON "CommissionEnquete"("legislature");

-- CreateIndex
CREATE INDEX "CommissionEnquete_chambre_idx" ON "CommissionEnquete"("chambre");

-- CreateIndex
CREATE INDEX "CommissionEnquete_statut_idx" ON "CommissionEnquete"("statut");

-- CreateTable
CREATE TABLE "ResumeLLM" (
    "id" TEXT NOT NULL,
    "travauxId" TEXT,
    "commissionEnqueteId" TEXT,
    "loiId" TEXT,
    "typeResume" "TypeResume" NOT NULL,
    "contenu" TEXT NOT NULL,
    "modeleLLM" TEXT NOT NULL,
    "versionPrompt" TEXT NOT NULL DEFAULT '1.0',
    "tokensEntree" INTEGER,
    "tokensSortie" INTEGER,
    "score" DOUBLE PRECISION,
    "estValide" BOOLEAN NOT NULL DEFAULT true,
    "hashSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeLLM_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeLLM_travauxId_idx" ON "ResumeLLM"("travauxId");

-- CreateIndex
CREATE INDEX "ResumeLLM_commissionEnqueteId_idx" ON "ResumeLLM"("commissionEnqueteId");

-- CreateIndex
CREATE INDEX "ResumeLLM_loiId_idx" ON "ResumeLLM"("loiId");

-- CreateIndex
CREATE INDEX "ResumeLLM_typeResume_idx" ON "ResumeLLM"("typeResume");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeLLM_travauxId_typeResume_key" ON "ResumeLLM"("travauxId", "typeResume");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeLLM_commissionEnqueteId_typeResume_key" ON "ResumeLLM"("commissionEnqueteId", "typeResume");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeLLM_loiId_typeResume_key" ON "ResumeLLM"("loiId", "typeResume");

-- CreateTable
CREATE TABLE "IndicateurStatistique" (
    "id" TEXT NOT NULL,
    "codeInsee" TEXT,
    "codeDataGouv" TEXT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "valeurActuelle" DOUBLE PRECISION,
    "dateValeur" TIMESTAMP(3),
    "unite" TEXT,
    "variationAnnuelle" DOUBLE PRECISION,
    "variationMensuelle" DOUBLE PRECISION,
    "themeId" TEXT,
    "urlSource" TEXT,
    "urlApiInsee" TEXT,
    "travauxId" TEXT,
    "derniereMiseAJour" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicateurStatistique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndicateurStatistique_themeId_idx" ON "IndicateurStatistique"("themeId");

-- CreateIndex
CREATE INDEX "IndicateurStatistique_travauxId_idx" ON "IndicateurStatistique"("travauxId");

-- CreateIndex
CREATE INDEX "IndicateurStatistique_codeInsee_idx" ON "IndicateurStatistique"("codeInsee");

-- AddForeignKey
ALTER TABLE "ThemeTravaux" ADD CONSTRAINT "ThemeTravaux_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ThemeTravaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravauxParlementaire" ADD CONSTRAINT "TravauxParlementaire_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "CommissionParlementaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravauxParlementaire" ADD CONSTRAINT "TravauxParlementaire_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ThemeTravaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravauxParlementaire" ADD CONSTRAINT "TravauxParlementaire_loiId_fkey" FOREIGN KEY ("loiId") REFERENCES "Loi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEnquete" ADD CONSTRAINT "CommissionEnquete_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "CommissionParlementaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeLLM" ADD CONSTRAINT "ResumeLLM_travauxId_fkey" FOREIGN KEY ("travauxId") REFERENCES "TravauxParlementaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeLLM" ADD CONSTRAINT "ResumeLLM_commissionEnqueteId_fkey" FOREIGN KEY ("commissionEnqueteId") REFERENCES "CommissionEnquete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeLLM" ADD CONSTRAINT "ResumeLLM_loiId_fkey" FOREIGN KEY ("loiId") REFERENCES "Loi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicateurStatistique" ADD CONSTRAINT "IndicateurStatistique_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ThemeTravaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicateurStatistique" ADD CONSTRAINT "IndicateurStatistique_travauxId_fkey" FOREIGN KEY ("travauxId") REFERENCES "TravauxParlementaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
