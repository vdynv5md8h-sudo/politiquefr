import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { senateursApi, groupesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Senateur, GroupePolitique, Pagination } from '@/types';

export default function SenateursPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const groupeId = searchParams.get('groupe') || '';

  // Récupérer les groupes pour le filtre
  const { data: groupesData } = useQuery({
    queryKey: ['groupes-senat'],
    queryFn: groupesApi.senat,
  });

  // Récupérer les sénateurs
  const { data, isLoading, error } = useQuery({
    queryKey: ['senateurs', page, groupeId],
    queryFn: () => senateursApi.liste({ page, groupeId: groupeId || undefined }),
  });

  const senateurs = data?.donnees as Senateur[] | undefined;
  const pagination = data?.pagination as Pagination | undefined;
  const groupes = groupesData?.donnees as GroupePolitique[] | undefined;

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
        <p className="text-red-600">Erreur lors du chargement des sénateurs</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sénateurs - PolitiqueFR</title>
        <meta name="description" content="Liste des sénateurs du Sénat français avec leurs profils et activité parlementaire." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sénateurs du Sénat
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {pagination?.total || 348} sénateurs en exercice
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={groupeId}
            onChange={(e) => changerFiltre('groupe', e.target.value)}
            className="input w-auto"
          >
            <option value="">Tous les groupes</option>
            {groupes?.map((groupe) => (
              <option key={groupe.id} value={groupe.id}>
                {groupe.acronyme} - {groupe.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Liste des sénateurs */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Chargement taille="lg" texte="Chargement des sénateurs..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {senateurs?.map((senateur) => (
                <Link
                  key={senateur.id}
                  to={`/senateurs/${senateur.id}`}
                  className="card-hover p-4 flex items-center space-x-4"
                >
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {senateur.photoUrl ? (
                      <img
                        src={senateur.photoUrl}
                        alt={`${senateur.prenom} ${senateur.nom}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-400">
                          {senateur.prenom[0]}{senateur.nom[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {senateur.civilite} {senateur.prenom} {senateur.nom}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {senateur.departement}
                    </p>
                    {senateur.groupe && (
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: senateur.groupe.couleur ? `${senateur.groupe.couleur}20` : '#e5e7eb',
                          color: senateur.groupe.couleur || '#374151',
                        }}
                      >
                        {senateur.groupe.acronyme}
                      </span>
                    )}
                  </div>

                  {/* Série */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Série {senateur.serieSenat}
                    </div>
                    <div className="text-xs text-gray-500">renouv. {senateur.serieSenat === 1 ? '2023' : '2026'}</div>
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
