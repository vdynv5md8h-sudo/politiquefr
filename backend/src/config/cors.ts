import cors from 'cors';
import { config, estProduction } from './env';

// Configuration CORS
const optionsCors: cors.CorsOptions = {
  origin: estProduction
    ? [config.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // Cache preflight pour 24 heures
};

export const middlewareCors = cors(optionsCors);
