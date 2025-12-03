import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { rechercheApi } from '@/services/api';
import clsx from 'clsx';

interface BarreRechercheProps {
  onRecherche?: (terme: string) => void;
  pleineLargeur?: boolean;
}

export default function BarreRecherche({ onRecherche, pleineLargeur }: BarreRechercheProps) {
  const [terme, setTerme] = useState('');
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const refInput = useRef<HTMLInputElement>(null);
  const refContainer = useRef<HTMLDivElement>(null);

  // Debounce du terme de recherche
  const [termeDebounce, setTermeDebounce] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTermeDebounce(terme);
    }, 300);
    return () => clearTimeout(timer);
  }, [terme]);

  // Requête d'autocomplétion
  const { data: suggestions } = useQuery({
    queryKey: ['autocomplete', termeDebounce],
    queryFn: () => rechercheApi.autocomplete(termeDebounce),
    enabled: termeDebounce.length >= 2,
    staleTime: 60000,
  });

  // Fermer les suggestions si clic extérieur
  useEffect(() => {
    function gererClicExterieur(event: MouseEvent) {
      if (refContainer.current && !refContainer.current.contains(event.target as Node)) {
        setFocus(false);
      }
    }

    document.addEventListener('mousedown', gererClicExterieur);
    return () => document.removeEventListener('mousedown', gererClicExterieur);
  }, []);

  const gererSoumission = (e: React.FormEvent) => {
    e.preventDefault();
    if (terme.trim().length >= 2) {
      if (onRecherche) {
        onRecherche(terme.trim());
      } else {
        navigate(`/recherche?q=${encodeURIComponent(terme.trim())}`);
      }
      setFocus(false);
    }
  };

  const gererSelectionSuggestion = (suggestion: { type: string; id: string }) => {
    setFocus(false);
    setTerme('');

    const routes: Record<string, string> = {
      depute: `/deputes/${suggestion.id}`,
      senateur: `/senateurs/${suggestion.id}`,
      maire: `/maires/${suggestion.id}`,
      groupe: `/groupes/${suggestion.id}`,
      loi: `/lois/${suggestion.id}`,
    };

    navigate(routes[suggestion.type] || '/recherche');
  };

  const listeSuggestions = suggestions?.donnees as Array<{
    type: string;
    id: string;
    texte: string;
  }> | undefined;

  return (
    <div ref={refContainer} className={clsx('relative', pleineLargeur ? 'w-full' : 'w-64')}>
      <form onSubmit={gererSoumission}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={refInput}
            type="text"
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            onFocus={() => setFocus(true)}
            placeholder="Rechercher un élu, une loi..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </form>

      {/* Suggestions */}
      {focus && listeSuggestions && listeSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {listeSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}-${index}`}
              onClick={() => gererSelectionSuggestion(suggestion)}
              className="w-full flex items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span
                className={clsx(
                  'w-2 h-2 rounded-full mr-3',
                  suggestion.type === 'depute' && 'bg-blue-500',
                  suggestion.type === 'senateur' && 'bg-purple-500',
                  suggestion.type === 'maire' && 'bg-green-500',
                  suggestion.type === 'groupe' && 'bg-orange-500',
                  suggestion.type === 'loi' && 'bg-red-500'
                )}
              />
              <span className="text-gray-900 dark:text-gray-100">{suggestion.texte}</span>
              <span className="ml-auto text-xs text-gray-500 capitalize">{suggestion.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
