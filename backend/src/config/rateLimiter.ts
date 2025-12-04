import rateLimit from 'express-rate-limit';

// Limiteur pour l'API publique
export const limiteurApiPublique = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statut: 429,
    message: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.',
  },
  keyGenerator: (req) => {
    // Utiliser X-Forwarded-For si derrière un proxy
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
  },
});

// Limiteur pour la recherche (plus restrictif)
export const limiteurRecherche = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 recherches par minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statut: 429,
    message: 'Limite de recherche atteinte. Veuillez patienter.',
  },
});

// Limiteur pour l'authentification (très restrictif)
export const limiteurAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statut: 429,
    message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  },
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
});

// Limiteur pour l'admin (plus permissif)
export const limiteurAdmin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statut: 429,
    message: 'Trop de requêtes admin.',
  },
});

// Limiteur pour la synchronisation (très permissif - une seule requête à la fois)
export const limiteurSync = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 syncs par heure max
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statut: 429,
    message: 'Trop de synchronisations. Veuillez attendre.',
  },
});
