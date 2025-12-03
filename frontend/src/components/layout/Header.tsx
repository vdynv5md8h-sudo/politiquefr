import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../common/ThemeToggle';
import BarreRecherche from '../common/BarreRecherche';

const navigation = [
  {
    nom: 'Élus',
    href: '#',
    sousMenu: [
      { nom: 'Députés', href: '/deputes' },
      { nom: 'Sénateurs', href: '/senateurs' },
      { nom: 'Maires', href: '/maires' },
    ],
  },
  { nom: 'Groupes', href: '/groupes' },
  { nom: 'Lois', href: '/lois' },
  { nom: 'Actualités', href: '/actualites' },
];

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [rechercheMobile, setRechercheMobile] = useState(false);
  const [sousMenuOuvert, setSousMenuOuvert] = useState<string | null>(null);
  const navigate = useNavigate();

  const gererRecherche = (terme: string) => {
    navigate(`/recherche?q=${encodeURIComponent(terme)}`);
    setRechercheMobile(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                PolitiqueFR
              </span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) =>
              item.sousMenu ? (
                <div
                  key={item.nom}
                  className="relative"
                  onMouseEnter={() => setSousMenuOuvert(item.nom)}
                  onMouseLeave={() => setSousMenuOuvert(null)}
                >
                  <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {item.nom}
                  </button>
                  {sousMenuOuvert === item.nom && (
                    <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        {item.sousMenu.map((sous) => (
                          <NavLink
                            key={sous.href}
                            to={sous.href}
                            className={({ isActive }) =>
                              `block px-4 py-2 text-sm ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`
                            }
                          >
                            {sous.nom}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {item.nom}
                </NavLink>
              )
            )}
          </div>

          {/* Actions droite */}
          <div className="flex items-center space-x-2">
            {/* Barre de recherche desktop */}
            <div className="hidden lg:block">
              <BarreRecherche onRecherche={gererRecherche} />
            </div>

            {/* Bouton recherche mobile */}
            <button
              onClick={() => setRechercheMobile(!rechercheMobile)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Toggle thème */}
            <ThemeToggle />

            {/* Menu mobile */}
            <button
              onClick={() => setMenuOuvert(!menuOuvert)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {menuOuvert ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        {rechercheMobile && (
          <div className="lg:hidden py-3 border-t border-gray-200 dark:border-gray-700">
            <BarreRecherche onRecherche={gererRecherche} pleineLargeur />
          </div>
        )}
      </nav>

      {/* Menu mobile */}
      {menuOuvert && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) =>
              item.sousMenu ? (
                <div key={item.nom}>
                  <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.nom}
                  </div>
                  {item.sousMenu.map((sous) => (
                    <NavLink
                      key={sous.href}
                      to={sous.href}
                      onClick={() => setMenuOuvert(false)}
                      className={({ isActive }) =>
                        `block pl-6 pr-3 py-2 text-sm rounded-md ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      {sous.nom}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOuvert(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {item.nom}
                </NavLink>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
