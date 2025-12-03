import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Instance de cache
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes par défaut
  checkperiod: 60, // Vérification toutes les 60 secondes
  useClones: false, // Performance: ne pas cloner les objets
});

// Configuration des TTL par type de données
export const TTL_CACHE = {
  MAIRES: 24 * 60 * 60, // 24 heures
  DEPUTES: 6 * 60 * 60, // 6 heures
  SENATEURS: 12 * 60 * 60, // 12 heures
  GROUPES: 12 * 60 * 60, // 12 heures
  LOIS: 2 * 60 * 60, // 2 heures
  ACTUALITES: 15 * 60, // 15 minutes
  RECHERCHE: 5 * 60, // 5 minutes
  GEOJSON: 7 * 24 * 60 * 60, // 7 jours
};

// Générer une clé de cache unique basée sur la requête
function genererCleCacheRequete(req: Request): string {
  const { originalUrl, method } = req;
  return `${method}:${originalUrl}`;
}

// Middleware de cache
export function middlewareCache(ttlSecondes = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ne cacher que les requêtes GET
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cleCache = genererCleCacheRequete(req);
    const donneesCachees = cache.get(cleCache);

    if (donneesCachees) {
      // Ajouter un header pour indiquer que c'est du cache
      res.setHeader('X-Cache', 'HIT');
      res.json(donneesCachees);
      return;
    }

    // Intercepter la méthode json pour cacher la réponse
    const jsonOriginal = res.json.bind(res);
    res.json = (body: unknown) => {
      // Ne cacher que les réponses de succès
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cleCache, body, ttlSecondes);
      }
      res.setHeader('X-Cache', 'MISS');
      return jsonOriginal(body);
    };

    next();
  };
}

// Fonctions utilitaires pour la gestion du cache

// Obtenir une valeur du cache
export function obtenirCache<T>(cle: string): T | undefined {
  return cache.get<T>(cle);
}

// Définir une valeur dans le cache
export function definirCache<T>(cle: string, valeur: T, ttl?: number): boolean {
  return cache.set(cle, valeur, ttl || 300);
}

// Supprimer une entrée du cache
export function supprimerCache(cle: string): number {
  return cache.del(cle);
}

// Supprimer toutes les entrées avec un préfixe
export function supprimerCacheParPrefixe(prefixe: string): number {
  const cles = cache.keys().filter((cle) => cle.startsWith(prefixe));
  return cache.del(cles);
}

// Vider tout le cache
export function viderCache(): void {
  cache.flushAll();
}

// Obtenir les statistiques du cache
export function statsCache(): NodeCache.Stats {
  return cache.getStats();
}

// Invalider le cache pour un type de données
export function invaliderCacheType(type: keyof typeof TTL_CACHE): void {
  const prefixe = `GET:/api/v1/${type.toLowerCase()}`;
  supprimerCacheParPrefixe(prefixe);
}
