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
import routesSync from './sync.routes';
import routesDashboard from './dashboard.routes';
import routesTravauxParlementaires from './travaux-parlementaires.routes';
import routesCommissionsEnquete from './commissions-enquete.routes';

const router = Router();

// Routes publiques - Dashboard
router.use('/dashboard', routesDashboard);

// Routes publiques - Élus
router.use('/maires', routesMaires);
router.use('/deputes', routesDeputes);
router.use('/senateurs', routesSenateurs);

// Routes publiques - Groupes politiques
router.use('/groupes', routesGroupes);

// Routes publiques - Lois et scrutins
router.use('/lois', routesLois);
router.use('/scrutins', routesScrutins);

// Routes publiques - Travaux parlementaires
router.use('/travaux-parlementaires', routesTravauxParlementaires);
router.use('/commissions-enquete', routesCommissionsEnquete);

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

// Routes de synchronisation (protégées par clé secrète)
router.use('/sync', routesSync);

export default router;
