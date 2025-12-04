import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const refMenu = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    function gererClicExterieur(event: MouseEvent) {
      if (refMenu.current && !refMenu.current.contains(event.target as Node)) {
        setMenuOuvert(false);
      }
    }

    document.addEventListener('mousedown', gererClicExterieur);
    return () => document.removeEventListener('mousedown', gererClicExterieur);
  }, []);

  const options = [
    { valeur: 'light', nom: 'Clair', icone: SunIcon },
    { valeur: 'dark', nom: 'Sombre', icone: MoonIcon },
    { valeur: 'system', nom: 'Système', icone: ComputerDesktopIcon },
  ] as const;

  const iconeActuelle = effectiveTheme === 'dark' ? MoonIcon : SunIcon;

  return (
    <div className="relative" ref={refMenu}>
      <button
        onClick={() => setMenuOuvert(!menuOuvert)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Changer le thème"
      >
        <iconeActuelle className="h-5 w-5" />
      </button>

      {menuOuvert && (
        <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.valeur}
                onClick={() => {
                  setTheme(option.valeur);
                  setMenuOuvert(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm ${
                  theme === option.valeur
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <option.icone className="h-4 w-4 mr-2" />
                {option.nom}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
