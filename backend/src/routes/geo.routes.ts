import { Router } from 'express';
import { middlewareCache, TTL_CACHE } from '../middleware/cache.middleware';
import { asyncHandler } from '../middleware/erreur.middleware';
import * as controleurGeo from '../controleurs/geo.controleur';

const router = Router();

// GET /api/v1/geo/circonscriptions - GeoJSON des circonscriptions législatives
router.get(
  '/circonscriptions',
  middlewareCache(TTL_CACHE.GEOJSON),
  asyncHandler(controleurGeo.circonscriptionsGeoJson)
);

// GET /api/v1/geo/departements - GeoJSON des départements
router.get(
  '/departements',
  middlewareCache(TTL_CACHE.GEOJSON),
  asyncHandler(controleurGeo.departementsGeoJson)
);

// GET /api/v1/geo/regions - GeoJSON des régions
router.get(
  '/regions',
  middlewareCache(TTL_CACHE.GEOJSON),
  asyncHandler(controleurGeo.regionsGeoJson)
);

// GET /api/v1/geo/circonscription/:id/depute - Député d'une circonscription
router.get(
  '/circonscription/:codeDept/:numCirco/depute',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurGeo.deputeCirconscription)
);

// GET /api/v1/geo/departement/:code/elus - Élus d'un département
router.get(
  '/departement/:code/elus',
  middlewareCache(TTL_CACHE.DEPUTES),
  asyncHandler(controleurGeo.elusDepartement)
);

export default router;
