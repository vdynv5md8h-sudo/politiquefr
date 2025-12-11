-- CreateTable: SeancePublique
CREATE TABLE "SeancePublique" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "seanceRef" TEXT,
    "sessionRef" TEXT,
    "legislature" INTEGER NOT NULL,
    "session" TEXT,
    "numSeance" INTEGER,
    "numSeanceJour" TEXT,
    "dateSeance" TIMESTAMP(3) NOT NULL,
    "dateSeanceStr" TEXT,
    "sommaire" TEXT,
    "orateurs" TEXT,
    "nombreInterventions" INTEGER,
    "nombreOrateurs" INTEGER,
    "dureeMinutes" INTEGER,
    "etat" TEXT,
    "validite" TEXT,
    "diffusion" TEXT,
    "urlCompteRendu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeancePublique_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Intervention
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "acteurRef" TEXT,
    "deputeId" TEXT,
    "orateur" TEXT NOT NULL,
    "qualite" TEXT,
    "roleDebat" TEXT,
    "texte" TEXT NOT NULL,
    "pointOdj" TEXT,
    "titrePoint" TEXT,
    "ordreAbsolu" INTEGER,
    "stime" DOUBLE PRECISION,
    "typeIntervention" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeancePublique_uid_key" ON "SeancePublique"("uid");

-- CreateIndex
CREATE INDEX "SeancePublique_legislature_idx" ON "SeancePublique"("legislature");

-- CreateIndex
CREATE INDEX "SeancePublique_dateSeance_idx" ON "SeancePublique"("dateSeance");

-- CreateIndex
CREATE INDEX "SeancePublique_session_idx" ON "SeancePublique"("session");

-- CreateIndex
CREATE INDEX "Intervention_seanceId_idx" ON "Intervention"("seanceId");

-- CreateIndex
CREATE INDEX "Intervention_acteurRef_idx" ON "Intervention"("acteurRef");

-- CreateIndex
CREATE INDEX "Intervention_deputeId_idx" ON "Intervention"("deputeId");

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "SeancePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
