import dotenv from 'dotenv';
import { z } from 'zod';

// Charger les variables d'environnement
dotenv.config();

// Schéma de validation des variables d'environnement
const schemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().default('file:./data/politiquefr.db'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit avoir au moins 32 caractères'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_MOT_DE_PASSE_INITIAL: z.string().optional(),
  DATA_GOUV_API_KEY: z.string().optional(),
});

// Valider et exporter la configuration
const resultatValidation = schemaEnv.safeParse(process.env);

if (!resultatValidation.success) {
  console.error('❌ Variables d\'environnement invalides:');
  console.error(resultatValidation.error.format());
  process.exit(1);
}

export const config = resultatValidation.data;

// Configuration spécifique par environnement
export const estProduction = config.NODE_ENV === 'production';
export const estDeveloppement = config.NODE_ENV === 'development';
export const estTest = config.NODE_ENV === 'test';
