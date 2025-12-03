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
import { deputesApi, loisApi, groupesApi } from '@/services/api';

export default function Accueil() {
  // Récupérer quelques statistiques
  const { data: statsDeputes } = useQuery({
    queryKey: ['deputes-stats'],
    queryFn: deputesApi.stats,
  });

  const { data: loisRecentes } = useQuery({
    queryKey: ['lois-recentes'],
    queryFn: loisApi.recentes,
  });

  const { data: composition } = useQuery({
    queryKey: ['groupes-composition'],
    queryFn: groupesApi.composition,
  });

  const stats = statsDeputes?.donnees as {
    total?: number;
    enCours?: number;
  } | undefined;

  interface LoiResume {
    id: string;
    titre: string;
    titreCourt?: string;
    statut: string;
    dateDepot: string;
  }

  const lois = (loisRecentes?.donnees as LoiResume[] | undefined)?.slice(0, 5);

  const sections = [
    {
      titre: 'Députés',
      description: 'Consultez les profils des 577 députés de l\'Assemblée nationale',
      icone: UserGroupIcon,
      lien: '/deputes',
      couleur: 'bg-blue-500',
    },
    {
      titre: 'Sénateurs',
      description: 'Découvrez les 348 sénateurs et leur activité parlementaire',
      icone: BuildingLibraryIcon,
      lien: '/senateurs',
      couleur: 'bg-purple-500',
    },
    {
      titre: 'Maires',
      description: 'Accédez aux fiches des maires de France',
      icone: MapPinIcon,
      lien: '/maires',
      couleur: 'bg-green-500',
    },
    {
      titre: 'Groupes politiques',
      description: 'Explorez la composition de l\'Assemblée et du Sénat',
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
      titre: 'Actualités',
      description: 'Restez informé de l\'actualité politique française',
      icone: NewspaperIcon,
      lien: '/actualites',
      couleur: 'bg-indigo-500',
    },
  ];

  return (
    <>
      <Helmet>
        <title>PolitiqueFR - Portail d'information politique française</title>
        <meta
          name="description"
          content="Découvrez les profils des élus français, suivez les votes au Parlement, et restez informé de l'actualité politique."
        />
      </Helmet>

      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              La politique française en transparence
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Accédez aux profils des élus, suivez les votes au Parlement, explorez les lois
              et restez informé de l'actualité politique.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/deputes"
                className="btn bg-white text-blue-600 hover:bg-blue-50 px-6 py-3"
              >
                Découvrir les députés
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
      {stats && (
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{stats.enCours || 577}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Députés en exercice</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">348</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Sénateurs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">~35 000</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Maires de France</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {(composition?.donnees as { assemblee?: unknown[] })?.assemblee?.length || 10}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Groupes politiques</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sections principales */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Explorer par catégorie
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

      {/* Lois récentes */}
      {lois && lois.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dernières lois
              </h2>
              <Link to="/lois" className="link text-sm">
                Voir toutes les lois →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lois.map((loi) => (
                <Link
                  key={loi.id}
                  to={`/lois/${loi.id}`}
                  className="card-hover p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="badge-primary">{loi.statut}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(loi.dateDepot).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                    {loi.titreCourt || loi.titre}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section données ouvertes */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Données ouvertes et transparence
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            PolitiqueFR utilise exclusivement des données publiques issues des sources
            officielles françaises. Aucun cookie de traçage n'est utilisé.
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
