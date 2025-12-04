import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { rechercheApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import {
  MagnifyingGlassIcon,
  UserIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  DocumentTextIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface ResultatRecherche {
  type: 'depute' | 'senateur' | 'maire' | 'groupe' | 'loi';
  id: string;
  titre: string;
  sousTitre?: string;
  score: number;
}

interface ReponseRecherche {
  requete: string;
  nombreResultats: number;
  resultats: ResultatRecherche[];
}

const TYPES_RECHERCHE = [
  { value: 'tout', label: 'Tout', icon: MagnifyingGlassIcon },
  { value: 'deputes', label: 'Députés', icon: BuildingLibraryIcon },
  { value: 'senateurs', label: 'Sénateurs', icon: BuildingLibraryIcon },
  { value: 'maires', label: 'Maires', icon: MapPinIcon },
  { value: 'groupes', label: 'Groupes', icon: UserGroupIcon },
  { value: 'lois', label: 'Lois', icon: DocumentTextIcon },
];

function getIconForType(type: string) {
  switch (type) {
    case 'depute':
    case 'senateur':
      return BuildingLibraryIcon;
    case 'maire':
      return MapPinIcon;
    case 'groupe':
      return UserGroupIcon;
    case 'loi':
      return DocumentTextIcon;
    default:
      return UserIcon;
  }
}

function getLinkForResult(result: ResultatRecherche): string {
  switch (result.type) {
    case 'depute':
      return `/deputes/${result.id}`;
    case 'senateur':
      return `/senateurs/${result.id}`;
    case 'maire':
      return `/maires/${result.id}`;
    case 'groupe':
      return `/groupes/${result.id}`;
    case 'loi':
      return `/lois/${result.id}`;
    default:
      return '#';
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'depute':
      return 'Député';
    case 'senateur':
      return 'Sénateur';
    case 'maire':
      return 'Maire';
    case 'groupe':
      return 'Groupe';
    case 'loi':
      return 'Loi';
    default:
      return type;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'depute':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'senateur':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'maire':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'groupe':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'loi':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

export default function RecherchePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const typeFiltre = searchParams.get('type') || 'tout';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
      if (inputValue) {
        setSearchParams({ q: inputValue, type: typeFiltre });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, typeFiltre, setSearchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recherche', debouncedQuery, typeFiltre],
    queryFn: () => rechercheApi.globale(debouncedQuery, typeFiltre),
    enabled: debouncedQuery.length >= 2,
  });

  const resultats = (data?.donnees as ReponseRecherche)?.resultats || [];

  const handleTypeChange = useCallback((newType: string) => {
    if (inputValue) {
      setSearchParams({ q: inputValue, type: newType });
    }
  }, [inputValue, setSearchParams]);

  return (
    <>
      <Helmet>
        <title>Recherche{debouncedQuery ? ` - ${debouncedQuery}` : ''} - PolitiqueFR</title>
        <meta
          name="description"
          content="Recherchez parmi les députés, sénateurs, maires, groupes politiques et lois de la République française."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Recherche
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez des élus, groupes politiques et lois
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Rechercher un élu, un groupe ou une loi..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {TYPES_RECHERCHE.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFiltre === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {debouncedQuery.length < 2 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Entrez au moins 2 caractères pour lancer la recherche</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Chargement taille="lg" texte="Recherche en cours..." />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 dark:text-red-400 py-12">
            <p>Une erreur est survenue lors de la recherche.</p>
          </div>
        ) : resultats.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun résultat trouvé</p>
            <p className="text-sm">
              Essayez de modifier votre recherche ou de changer le filtre
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {resultats.length} résultat{resultats.length > 1 ? 's' : ''} pour "{debouncedQuery}"
            </p>

            {resultats.map((result) => {
              const Icon = getIconForType(result.type);
              return (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={getLinkForResult(result)}
                  className="block card card-hover p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {result.titre}
                        </h3>
                        <span className={`badge text-xs ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.sousTitre && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {result.sousTitre}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Quick Search Suggestions */}
        {!debouncedQuery && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Suggestions de recherche
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Macron', 'Le Pen', 'LFI', 'Renaissance', 'Paris', 'Immigration'].map((term) => (
                <button
                  key={term}
                  onClick={() => setInputValue(term)}
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Sources */}
        <div className="mt-12 text-center text-xs text-gray-400">
          Sources : Assemblée nationale, Sénat, data.gouv.fr (RNE)
        </div>
      </div>
    </>
  );
}
