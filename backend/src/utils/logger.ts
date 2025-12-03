import winston from 'winston';
import { estProduction } from '../config/env';

// Format personnalisé pour le développement
const formatDeveloppement = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Format pour la production (JSON)
const formatProduction = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Créer le logger
export const logger = winston.createLogger({
  level: estProduction ? 'info' : 'debug',
  format: estProduction ? formatProduction : formatDeveloppement,
  defaultMeta: { service: 'politiquefr-api' },
  transports: [
    new winston.transports.Console(),
    // En production, ajouter un fichier de logs
    ...(estProduction
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

// Fonctions utilitaires pour le logging
export const logInfo = (message: string, meta?: object) => logger.info(message, meta);
export const logError = (message: string, erreur?: Error | unknown) => {
  if (erreur instanceof Error) {
    logger.error(message, { erreur: erreur.message, stack: erreur.stack });
  } else {
    logger.error(message, { erreur });
  }
};
export const logWarn = (message: string, meta?: object) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: object) => logger.debug(message, meta);
