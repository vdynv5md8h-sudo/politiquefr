import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config, estProduction } from './config/env';
import { middlewareCors } from './config/cors';
import { limiteurApiPublique } from './config/rateLimiter';
import { gestionnaireErreurs, routeNonTrouvee } from './middleware/erreur.middleware';
import { verifierConnexionDb, fermerConnexionDb } from './config/database';
import { logInfo, logError } from './utils/logger';

// Import des routes
import routes from './routes';

// Créer l'application Express
const app: Express = express();

// ================= MIDDLEWARES DE SÉCURITÉ =================

// Helmet pour les headers de sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.FRONTEND_URL],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: estProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  })
);

// CORS
app.use(middlewareCors);

// Compression des réponses
app.use(compression());

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
app.use('/api/', limiteurApiPublique);

// Confiance au proxy (pour les headers X-Forwarded-*)
if (estProduction) {
  app.set('trust proxy', 1);
}

// ================= ROUTES =================

// Route de santé
app.get('/health', async (_req, res) => {
  const dbConnectee = await verifierConnexionDb();
  res.status(dbConnectee ? 200 : 503).json({
    statut: dbConnectee ? 'ok' : 'erreur',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    baseDeDonnees: dbConnectee ? 'connectée' : 'déconnectée',
  });
});

// Routes API v1
app.use('/api/v1', routes);

// ================= GESTION DES ERREURS =================

// Route non trouvée
app.use(routeNonTrouvee);

// Gestionnaire d'erreurs global
app.use(gestionnaireErreurs);

// ================= DÉMARRAGE DU SERVEUR =================

async function demarrerServeur(): Promise<void> {
  try {
    // Vérifier la connexion à la base de données
    const dbOk = await verifierConnexionDb();
    if (!dbOk) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    logInfo('✅ Connexion à la base de données établie');

    // Démarrer le serveur
    const serveur = app.listen(config.PORT, () => {
      logInfo(`🚀 Serveur démarré sur le port ${config.PORT}`);
      logInfo(`📍 Environnement: ${config.NODE_ENV}`);
      logInfo(`🔗 API: http://localhost:${config.PORT}/api/v1`);
    });

    // Gestion de l'arrêt propre
    const gererArret = async (signal: string) => {
      logInfo(`\n${signal} reçu. Arrêt en cours...`);

      serveur.close(async () => {
        logInfo('✅ Serveur HTTP fermé');
        await fermerConnexionDb();
        logInfo('✅ Connexion à la base de données fermée');
        process.exit(0);
      });

      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        logError('Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gererArret('SIGTERM'));
    process.on('SIGINT', () => gererArret('SIGINT'));
  } catch (erreur) {
    logError('❌ Erreur au démarrage du serveur', erreur);
    process.exit(1);
  }
}

// Démarrer le serveur
demarrerServeur();

export default app;
