import cors from 'cors';
import { config, estProduction } from './env';

// Configuration CORS
const originesAutorisees = estProduction
  ? [
      config.FRONTEND_URL,
      'https://frontend-woad-tau-52.vercel.app',
      // Autoriser tous les sous-domaines Vercel du projet
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const optionsCors: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (curl, apps mobiles)
    if (!origin) return callback(null, true);

    // Vérifier si l'origin est dans la liste ou est un domaine Vercel autorisé
    const estAutorise = originesAutorisees.some(o => origin === o) ||
      origin.includes('vdynv5md8h-sudos-projects.vercel.app') ||
      origin.includes('frontend-woad-tau-52.vercel.app') ||
      (origin.endsWith('.vercel.app') && origin.includes('politiquefr'));

    if (estAutorise) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorisé'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // Cache preflight pour 24 heures
};

export const middlewareCors = cors(optionsCors);
