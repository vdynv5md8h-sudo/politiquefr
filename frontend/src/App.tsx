import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import Chargement from './components/common/Chargement';

// Chargement paresseux des pages
const Accueil = lazy(() => import('./pages/Accueil'));
const DeputesPage = lazy(() => import('./pages/profils/DeputesPage'));
const DeputeDetailPage = lazy(() => import('./pages/profils/DeputeDetailPage'));
const SenateursPage = lazy(() => import('./pages/profils/SenateursPage'));
const SenateurDetailPage = lazy(() => import('./pages/profils/SenateurDetailPage'));
const MairesPage = lazy(() => import('./pages/profils/MairesPage'));
const MaireDetailPage = lazy(() => import('./pages/profils/MaireDetailPage'));
const GroupesPage = lazy(() => import('./pages/groupes/GroupesPage'));
const GroupeDetailPage = lazy(() => import('./pages/groupes/GroupeDetailPage'));
const LoisPage = lazy(() => import('./pages/lois/LoisPage'));
const LoiDetailPage = lazy(() => import('./pages/lois/LoiDetailPage'));
const ActualitesPage = lazy(() => import('./pages/actualites/ActualitesPage'));
const AffairesJudiciairesPage = lazy(() => import('./pages/actualites/AffairesJudiciairesPage'));
const TravauxParlementairesPage = lazy(() => import('./pages/travaux/TravauxParlementairesPage'));
const TravauxDetailPage = lazy(() => import('./pages/travaux/TravauxDetailPage'));
const AmendementsPage = lazy(() => import('./pages/amendements/AmendementsPage'));
const AmendementDetailPage = lazy(() => import('./pages/amendements/AmendementDetailPage'));
const RecherchePage = lazy(() => import('./pages/RecherchePage'));
const APropos = lazy(() => import('./pages/APropos'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const NonTrouve = lazy(() => import('./pages/NonTrouve'));

// Pages Admin
const AdminConnexion = lazy(() => import('./pages/admin/AdminConnexion'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <Suspense fallback={<Chargement pleinePage />}>
      <Routes>
        {/* Routes publiques avec layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Accueil />} />

          {/* Profils des élus */}
          <Route path="deputes" element={<DeputesPage />} />
          <Route path="deputes/:id" element={<DeputeDetailPage />} />
          <Route path="senateurs" element={<SenateursPage />} />
          <Route path="senateurs/:id" element={<SenateurDetailPage />} />
          <Route path="maires" element={<MairesPage />} />
          <Route path="maires/:id" element={<MaireDetailPage />} />

          {/* Groupes politiques */}
          <Route path="groupes" element={<GroupesPage />} />
          <Route path="groupes/:id" element={<GroupeDetailPage />} />

          {/* Lois */}
          <Route path="lois" element={<LoisPage />} />
          <Route path="lois/:id" element={<LoiDetailPage />} />

          {/* Travaux parlementaires */}
          <Route path="travaux-parlementaires" element={<TravauxParlementairesPage />} />
          <Route path="travaux-parlementaires/:id" element={<TravauxDetailPage />} />
          <Route path="travaux/:id" element={<TravauxDetailPage />} />

          {/* Amendements */}
          <Route path="amendements" element={<AmendementsPage />} />
          <Route path="amendements/:id" element={<AmendementDetailPage />} />

          {/* Actualités */}
          <Route path="actualites" element={<ActualitesPage />} />
          <Route path="affaires-judiciaires" element={<AffairesJudiciairesPage />} />

          {/* Recherche */}
          <Route path="recherche" element={<RecherchePage />} />

          {/* Pages statiques */}
          <Route path="a-propos" element={<APropos />} />
          <Route path="mentions-legales" element={<MentionsLegales />} />

          {/* Page 404 */}
          <Route path="*" element={<NonTrouve />} />
        </Route>

        {/* Routes Admin (sans layout public) */}
        <Route path="/admin/connexion" element={<AdminConnexion />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}

export default App;
