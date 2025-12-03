import { Router } from 'express';

// Import des routes par module
import routesMaires from './maires.routes';
import routesDeputes from './deputes.routes';
import routesSenateurs from './senateurs.routes';
import routesGroupes from './groupes.routes';
import routesLois from './lois.routes';
import routesScrutins from './scrutins.routes';
import routesActualites from './actualites.routes';
import routesRecherche from './recherche.routes';
import routesAuth from './auth.routes';
import routesAdmin from './admin.routes';
import routesGeo from './geo.routes';

const router = Router();

// Routes publiques - Élus
router.use('/maires', routesMaires);
router.use('/deputes', routesDeputes);
router.use('/senateurs', routesSenateurs);

// Routes publiques - Groupes politiques
router.use('/groupes', routesGroupes);

// Routes publiques - Lois et scrutins
router.use('/lois', routesLois);
router.use('/scrutins', routesScrutins);

// Routes publiques - Actualités
router.use('/actualites', routesActualites);

// Routes publiques - Recherche
router.use('/recherche', routesRecherche);

// Routes publiques - Données géographiques
router.use('/geo', routesGeo);

// Routes d'authentification
router.use('/auth', routesAuth);

// Routes admin (protégées)
router.use('/admin', routesAdmin);

export default router;
