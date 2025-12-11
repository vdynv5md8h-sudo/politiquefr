-- AlterTable: Add new columns to Amendement
ALTER TABLE "Amendement" ADD COLUMN "uid" TEXT;
ALTER TABLE "Amendement" ADD COLUMN "legislature" INTEGER NOT NULL DEFAULT 17;
ALTER TABLE "Amendement" ADD COLUMN "travauxId" TEXT;
ALTER TABLE "Amendement" ADD COLUMN "texteLegislatifRef" TEXT;
ALTER TABLE "Amendement" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make loiId nullable (was NOT NULL)
ALTER TABLE "Amendement" ALTER COLUMN "loiId" DROP NOT NULL;

-- Make auteurs nullable (was NOT NULL)
ALTER TABLE "Amendement" ALTER COLUMN "auteurs" DROP NOT NULL;

-- Generate uid for existing rows based on id
UPDATE "Amendement" SET "uid" = id WHERE "uid" IS NULL;

-- Make uid NOT NULL and add unique constraint
ALTER TABLE "Amendement" ALTER COLUMN "uid" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Amendement_uid_key" ON "Amendement"("uid");

-- CreateIndex
CREATE INDEX "Amendement_travauxId_idx" ON "Amendement"("travauxId");

-- CreateIndex
CREATE INDEX "Amendement_legislature_idx" ON "Amendement"("legislature");

-- AddForeignKey
ALTER TABLE "Amendement" ADD CONSTRAINT "Amendement_travauxId_fkey" FOREIGN KEY ("travauxId") REFERENCES "TravauxParlementaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
