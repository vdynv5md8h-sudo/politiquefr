import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { loisApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Loi, TypeLoi, StatutLoi, ThemeLoi, Pagination } from '@/types';
import {
  DocumentTextIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface LoiAvecStats extends Loi {
  theme?: ThemeLoi;
  _count?: {
    scrutins: number;
    amendements: number;
  };
}

interface LoisResponse {
  donnees: LoiAvecStats[];
  pagination: Pagination;
}

// Labels courts pour les types de loi
const TYPE_LOI_SHORT: Record<TypeLoi, string> = {
  PROJET_LOI: 'PJL',
  PROPOSITION_LOI: 'PPL',
  PROJET_LOI_ORGANIQUE: 'PJLO',
  PROPOSITION_LOI_ORGANIQUE: 'PPLO',
  PROJET_LOI_FINANCES: 'PLF',
  PROJET_LOI_REGLEMENT: 'PJLR',
  PROJET_LOI_FINANCEMENT_SECU: 'PLFSS',
  PROPOSITION_RESOLUTION: 'PPRE',
};

// Labels pour les statuts
const STATUT_LOI_LABELS: Record<StatutLoi, string> = {
  DEPOSE: 'Déposé',
  EN_COMMISSION: 'En commission',
  EN_SEANCE: 'En séance',
  ADOPTE_PREMIERE_LECTURE: 'Adopté 1ère lecture',
  NAVETTE: 'En navette',
  ADOPTE_DEFINITIF: 'Adopté définitivement',
  PROMULGUE: 'Promulgué',
  REJETE: 'Rejeté',
  RETIRE: 'Retiré',
  CADUQUE: 'Caduque',
};

const STATUT_LOI_COLORS: Record<StatutLoi, string> = {
  DEPOSE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  EN_COMMISSION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  EN_SEANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ADOPTE_PREMIERE_LECTURE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  NAVETTE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  ADOPTE_DEFINITIF: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  PROMULGUE: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200',
  REJETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  RETIRE: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  CADUQUE: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400',
};

function getStatutIcon(statut: StatutLoi) {
  switch (statut) {
    case 'PROMULGUE':
    case 'ADOPTE_DEFINITIF':
      return CheckCircleIcon;
    case 'REJETE':
      return XCircleIcon;
    case 'EN_SEANCE':
    case 'EN_COMMISSION':
    case 'NAVETTE':
      return ClockIcon;
    case 'RETIRE':
    case 'CADUQUE':
      return ArrowPathIcon;
    default:
      return DocumentTextIcon;
  }
}

// Liste des types pour le filtre
const TYPES_LOI: { value: TypeLoi | ''; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'PROJET_LOI', label: 'Projet de loi' },
  { value: 'PROPOSITION_LOI', label: 'Proposition de loi' },
  { value: 'PROJET_LOI_FINANCES', label: 'PLF (finances)' },
  { value: 'PROJET_LOI_FINANCEMENT_SECU', label: 'PLFSS (sécu)' },
  { value: 'PROJET_LOI_ORGANIQUE', label: 'Projet de loi organique' },
  { value: 'PROPOSITION_LOI_ORGANIQUE', label: 'Proposition de loi organique' },
  { value: 'PROPOSITION_RESOLUTION', label: 'Proposition de résolution' },
];

// Liste des statuts pour le filtre
const STATUTS_LOI: { value: StatutLoi | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DEPOSE', label: 'Déposé' },
  { value: 'EN_COMMISSION', label: 'En commission' },
  { value: 'EN_SEANCE', label: 'En séance' },
  { value: 'NAVETTE', label: 'En navette' },
  { value: 'ADOPTE_PREMIERE_LECTURE', label: 'Adopté 1ère lecture' },
  { value: 'ADOPTE_DEFINITIF', label: 'Adopté définitivement' },
  { value: 'PROMULGUE', label: 'Promulgué' },
  { value: 'REJETE', label: 'Rejeté' },
  { value: 'RETIRE', label: 'Retiré' },
];

export default function LoisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Récupérer les paramètres de l'URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const typeFiltre = searchParams.get('type') || '';
  const statutFiltre = searchParams.get('statut') || '';
  const themeFiltre = searchParams.get('theme') || '';

  // Récupérer la liste des lois
  const { data: loisData, isLoading: isLoadingLois } = useQuery({
    queryKey: ['lois', page, typeFiltre, statutFiltre, themeFiltre],
    queryFn: () =>
      loisApi.liste({
        page,
        statut: statutFiltre || undefined,
        type: typeFiltre || undefined,
      }),
  });

  // Récupérer la liste des thèmes
  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: () => loisApi.themes(),
  });

  const lois = (loisData as LoisResponse | undefined)?.donnees || [];
  const pagination = (loisData as LoisResponse | undefined)?.pagination;
  const themes = (themesData?.donnees as Array<ThemeLoi & { _count: { lois: number } }>) || [];

  // Mettre à jour les filtres
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset page on filter change
    setSearchParams(newParams);
  };

  const changePage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = typeFiltre || statutFiltre || themeFiltre;

  return (
    <>
      <Helmet>
        <title>Textes législatifs - PolitiqueFR</title>
        <meta
          name="description"
          content="Suivez les projets et propositions de loi en France : dépôt, examen en commission, débats en séance, adoption et promulgation."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Textes législatifs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Projets de loi, propositions de loi et résolutions en discussion au Parlement
          </p>
        </div>

        {/* Barre de filtres */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline flex items-center gap-2 ${showFilters ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('statut', 'EN_SEANCE')}
                className={`badge cursor-pointer ${
                  statutFiltre === 'EN_SEANCE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                En séance
              </button>
              <button
                onClick={() => updateFilter('statut', 'EN_COMMISSION')}
                className={`badge cursor-pointer ${
                  statutFiltre === 'EN_COMMISSION'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                En commission
              </button>
              <button
                onClick={() => updateFilter('statut', 'PROMULGUE')}
                className={`badge cursor-pointer ${
                  statutFiltre === 'PROMULGUE'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Promulgué
              </button>
            </div>

            {/* Bouton effacer */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Effacer les filtres
              </button>
            )}

            {/* Compteur */}
            {pagination && (
              <div className="ml-auto text-sm text-gray-500">
                {pagination.total} texte{pagination.total > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Panneau de filtres détaillés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtre par type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de texte
                  </label>
                  <select
                    value={typeFiltre}
                    onChange={(e) => updateFilter('type', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  >
                    {TYPES_LOI.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre par statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={statutFiltre}
                    onChange={(e) => updateFilter('statut', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  >
                    {STATUTS_LOI.map((statut) => (
                      <option key={statut.value} value={statut.value}>
                        {statut.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre par thème */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thème
                  </label>
                  <select
                    value={themeFiltre}
                    onChange={(e) => updateFilter('theme', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  >
                    <option value="">Tous les thèmes</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.nom} ({theme._count.lois})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste des lois */}
        {isLoadingLois ? (
          <div className="flex justify-center py-12">
            <Chargement taille="lg" texte="Chargement des textes législatifs..." />
          </div>
        ) : lois.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun texte trouvé
            </h2>
            <p className="text-gray-500 mb-4">
              Essayez de modifier vos filtres de recherche
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-primary">
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {lois.map((loi) => {
              const StatutIcon = getStatutIcon(loi.statut);
              return (
                <Link
                  key={loi.id}
                  to={`/lois/${loi.id}`}
                  className="card card-hover p-5 block"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Badge type */}
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-sm">
                        {TYPE_LOI_SHORT[loi.type]}
                      </span>
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`badge text-xs ${STATUT_LOI_COLORS[loi.statut]}`}>
                          <StatutIcon className="h-3 w-3 mr-1" />
                          {STATUT_LOI_LABELS[loi.statut]}
                        </span>
                        {loi.theme && (
                          <span className="badge text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {loi.theme.nom}
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {loi.titreCourt || loi.titre}
                      </h2>

                      {loi.titreCourt && loi.titreCourt !== loi.titre && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                          {loi.titre}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(loi.dateDepot).toLocaleDateString('fr-FR')}
                        </span>
                        {loi._count && (
                          <>
                            {loi._count.scrutins > 0 && (
                              <span>{loi._count.scrutins} scrutin{loi._count.scrutins > 1 ? 's' : ''}</span>
                            )}
                            {loi._count.amendements > 0 && (
                              <span>{loi._count.amendements} amendement{loi._count.amendements > 1 ? 's' : ''}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Flèche */}
                    <div className="hidden md:flex items-center">
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => changePage(page - 1)}
              disabled={!pagination.precedent}
              className="btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1">
              {/* Première page */}
              {page > 3 && (
                <>
                  <button
                    onClick={() => changePage(1)}
                    className="btn-outline px-3 py-1"
                  >
                    1
                  </button>
                  {page > 4 && <span className="px-2 text-gray-400">...</span>}
                </>
              )}

              {/* Pages autour de la page courante */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p >= page - 2 && p <= page + 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => changePage(p)}
                    className={`px-3 py-1 rounded-lg ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'btn-outline'
                    }`}
                  >
                    {p}
                  </button>
                ))}

              {/* Dernière page */}
              {page < pagination.totalPages - 2 && (
                <>
                  {page < pagination.totalPages - 3 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => changePage(pagination.totalPages)}
                    className="btn-outline px-3 py-1"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => changePage(page + 1)}
              disabled={!pagination.suivant}
              className="btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Info pagination */}
        {pagination && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} · {pagination.total} textes
          </div>
        )}

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sources : Assemblée nationale, Sénat, Légifrance
        </div>
      </div>
    </>
  );
}
