import { PrismaClient } from '@prisma/client';
import { config, estDeveloppement } from './env';

// Instance singleton de Prisma
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: estDeveloppement ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });
};

// Déclaration globale pour éviter les instances multiples en développement
declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Créer ou réutiliser l'instance Prisma
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (estDeveloppement) {
  globalThis.prisma = prisma;
}

// Fonction pour fermer la connexion proprement
export async function fermerConnexionDb(): Promise<void> {
  await prisma.$disconnect();
}

// Fonction pour vérifier la connexion
export async function verifierConnexionDb(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (erreur) {
    console.error('❌ Erreur de connexion à la base de données:', erreur);
    return false;
  }
}
