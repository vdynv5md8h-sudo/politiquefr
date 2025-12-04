import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import {
  UserGroupIcon,
  DocumentTextIcon,
  NewspaperIcon,
  ScaleIcon,
  BuildingLibraryIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import GroupeBarChart from '@/components/charts/GroupeBarChart';
import GenreDonutChart from '@/components/charts/GenreDonutChart';
import ScrutinsRecents from '@/components/dashboard/ScrutinsRecents';
import LoisEnCours from '@/components/dashboard/LoisEnCours';

interface GroupeData {
  id: string;
  acronyme: string;
  nom: string;
  couleur: string;
  nombre: number;
}

interface Scrutin {
  id: string;
  titre: string;
  dateScrutin: string;
  resultat: 'ADOPTE' | 'REJETE' | null;
  chambre: 'ASSEMBLEE' | 'SENAT';
  pour: number;
  contre: number;
  abstention: number;
  loi?: {
    id: string;
    titre: string;
    titreCourt?: string;
  } | null;
}

interface Loi {
  id: string;
  titre: string;
  titreCourt?: string;
  statut: string;
  type: string;
  dateDepot: string;
}

interface DashboardData {
  compteurs: {
    deputes: number;
    senateurs: number;
    maires: number;
  };
  groupesAssemblee: GroupeData[];
  groupesSenat: GroupeData[];
  genreAssemblee: { hommes: number; femmes: number };
  genreSenat: { hommes: number; femmes: number };
  scrutinsRecents: Scrutin[];
  loisEnCours: Loi[];
}

export default function Accueil() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const dashboard = data?.donnees as DashboardData | undefined;

  const sections = [
    {
      titre: 'Deputes',
      description: 'Consultez les profils des 577 deputes de l\'Assemblee nationale',
      icone: UserGroupIcon,
      lien: '/deputes',
      couleur: 'bg-blue-500',
    },
    {
      titre: 'Senateurs',
      description: 'Decouvrez les 348 senateurs et leur activite parlementaire',
      icone: BuildingLibraryIcon,
      lien: '/senateurs',
      couleur: 'bg-purple-500',
    },
    {
      titre: 'Maires',
      description: 'Accedez aux fiches des maires de France',
      icone: MapPinIcon,
      lien: '/maires',
      couleur: 'bg-green-500',
    },
    {
      titre: 'Groupes politiques',
      description: 'Explorez la composition de l\'Assemblee et du Senat',
      icone: ScaleIcon,
      lien: '/groupes',
      couleur: 'bg-orange-500',
    },
    {
      titre: 'Lois',
      description: 'Suivez le parcours des textes de loi et les votes',
      icone: DocumentTextIcon,
      lien: '/lois',
      couleur: 'bg-red-500',
    },
    {
      titre: 'Actualites',
      description: 'Restez informe de l\'actualite politique francaise',
      icone: NewspaperIcon,
      lien: '/actualites',
      couleur: 'bg-indigo-500',
    },
  ];

  return (
    <>
      <Helmet>
        <title>PolitiqueFR - Portail d'information politique francaise</title>
        <meta
          name="description"
          content="Decouvrez les profils des elus francais, suivez les votes au Parlement, et restez informe de l'actualite politique."
        />
      </Helmet>

      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              La politique francaise en transparence
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Accedez aux profils des elus, suivez les votes au Parlement, explorez les lois
              et restez informe de l'actualite politique.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/deputes"
                className="btn bg-white text-blue-600 hover:bg-blue-50 px-6 py-3"
              >
                Decouvrir les deputes
              </Link>
              <Link
                to="/lois"
                className="btn bg-blue-700 text-white hover:bg-blue-600 border border-blue-500 px-6 py-3"
              >
                Explorer les lois
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques rapides */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Chargement taille="sm" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboard?.compteurs.deputes || 577}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Deputes en exercice</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {dashboard?.compteurs.senateurs || 348}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Senateurs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {dashboard?.compteurs.maires?.toLocaleString('fr-FR') || '~35 000'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Maires de France</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {(dashboard?.groupesAssemblee?.length || 0) + (dashboard?.groupesSenat?.length || 0) || 16}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Groupes politiques</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard avec graphiques */}
      {dashboard && (
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Vue d'ensemble du Parlement
            </h2>

            {/* Repartition par groupe politique */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="card p-6">
                <GroupeBarChart
                  data={dashboard.groupesAssemblee}
                  titre="Assemblee nationale"
                />
              </div>
              <div className="card p-6">
                <GroupeBarChart
                  data={dashboard.groupesSenat}
                  titre="Senat"
                />
              </div>
            </div>

            {/* Repartition par genre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="card p-6">
                <GenreDonutChart
                  data={dashboard.genreAssemblee}
                  titre="Parite a l'Assemblee nationale"
                />
              </div>
              <div className="card p-6">
                <GenreDonutChart
                  data={dashboard.genreSenat}
                  titre="Parite au Senat"
                />
              </div>
            </div>

            {/* Activite parlementaire */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Derniers scrutins
                </h3>
                <ScrutinsRecents scrutins={dashboard.scrutinsRecents} />
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Textes en discussion
                </h3>
                <LoisEnCours lois={dashboard.loisEnCours} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sections principales */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Explorer par categorie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Link
                key={section.titre}
                to={section.lien}
                className="card-hover p-6 flex items-start space-x-4 group"
              >
                <div
                  className={`${section.couleur} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}
                >
                  <section.icone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {section.titre}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {section.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section donnees ouvertes */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Donnees ouvertes et transparence
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            PolitiqueFR utilise exclusivement des donnees publiques issues des sources
            officielles francaises. Aucun cookie de tracage n'est utilise.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="https://data.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              data.gouv.fr
            </a>
            <a
              href="https://nosdeputes.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              nosdeputes.fr
            </a>
            <a
              href="https://data.senat.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              data.senat.fr
            </a>
            <a
              href="https://data.assemblee-nationale.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              data.assemblee-nationale.fr
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
