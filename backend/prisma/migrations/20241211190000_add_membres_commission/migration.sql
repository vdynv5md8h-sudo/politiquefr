-- CreateEnum: RoleCommission
CREATE TYPE "RoleCommission" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE', 'MEMBRE');

-- CreateTable: MembreCommission
CREATE TABLE "MembreCommission" (
    "id" TEXT NOT NULL,
    "deputeId" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "role" "RoleCommission" NOT NULL DEFAULT 'MEMBRE',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembreCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembreCommission_deputeId_commissionId_key" ON "MembreCommission"("deputeId", "commissionId");

-- CreateIndex
CREATE INDEX "MembreCommission_commissionId_idx" ON "MembreCommission"("commissionId");

-- CreateIndex
CREATE INDEX "MembreCommission_deputeId_idx" ON "MembreCommission"("deputeId");

-- CreateIndex
CREATE INDEX "MembreCommission_actif_idx" ON "MembreCommission"("actif");

-- AddForeignKey
ALTER TABLE "MembreCommission" ADD CONSTRAINT "MembreCommission_deputeId_fkey" FOREIGN KEY ("deputeId") REFERENCES "Depute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreCommission" ADD CONSTRAINT "MembreCommission_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "CommissionParlementaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
