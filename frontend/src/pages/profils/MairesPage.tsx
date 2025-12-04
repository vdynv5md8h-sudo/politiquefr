import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { mairesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Maire, Pagination } from '@/types';

export default function MairesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const codeDepartement = searchParams.get('departement') || '';

  // Récupérer les maires
  const { data, isLoading, error } = useQuery({
    queryKey: ['maires', page, codeDepartement],
    queryFn: () => mairesApi.liste({ page, codeDepartement: codeDepartement || undefined }),
  });

  const maires = data?.donnees as Maire[] | undefined;
  const pagination = data?.pagination as Pagination | undefined;

  const changerPage = (nouvellePage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', nouvellePage.toString());
    setSearchParams(params);
  };

  const changerFiltre = (nom: string, valeur: string) => {
    const params = new URLSearchParams(searchParams);
    if (valeur) {
      params.set(nom, valeur);
    } else {
      params.delete(nom);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">Erreur lors du chargement des maires</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Maires - PolitiqueFR</title>
        <meta name="description" content="Liste des maires des communes de France avec leurs profils et informations de mandat." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Maires de France
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {pagination?.total?.toLocaleString('fr-FR') || '34 868'} maires en exercice
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Code département (ex: 75, 13, 69)..."
            value={codeDepartement}
            onChange={(e) => changerFiltre('departement', e.target.value)}
            className="input w-auto"
          />
        </div>

        {/* Liste des maires */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Chargement taille="lg" texte="Chargement des maires..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maires?.map((maire) => (
                <Link
                  key={maire.id}
                  to={`/maires/${maire.id}`}
                  className="card-hover p-4 flex items-center space-x-4"
                >
                  {/* Photo ou initiales */}
                  <div className="flex-shrink-0">
                    {maire.photoUrl ? (
                      <img
                        src={maire.photoUrl}
                        alt={`${maire.prenom} ${maire.nom}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-300">
                          {maire.prenom?.[0]}{maire.nom?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {maire.civilite} {maire.prenom} {maire.nom}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {maire.libelleCommune}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {maire.libelleDepartement} ({maire.codeDepartement})
                    </p>
                  </div>

                  {/* Code commune */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {maire.codeCommune}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => changerPage(page - 1)}
                  disabled={!pagination.precedent}
                  className="btn-secondary disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-gray-600 dark:text-gray-400">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
                <button
                  onClick={() => changerPage(page + 1)}
                  disabled={!pagination.suivant}
                  className="btn-secondary disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
