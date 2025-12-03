import { Link } from 'react-router-dom';

export default function Footer() {
  const anneeActuelle = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                PolitiqueFR
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Portail d'information sur la politique française. Accédez aux profils
              des élus, aux votes, aux lois et à l'actualité politique en toute
              transparence.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Données issues de sources officielles :{' '}
              <a
                href="https://data.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                data.gouv.fr
              </a>
              ,{' '}
              <a
                href="https://nosdeputes.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                nosdeputes.fr
              </a>
              ,{' '}
              <a
                href="https://data.senat.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                data.senat.fr
              </a>
            </p>
          </div>

          {/* Navigation rapide */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/deputes"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Députés
                </Link>
              </li>
              <li>
                <Link
                  to="/senateurs"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Sénateurs
                </Link>
              </li>
              <li>
                <Link
                  to="/maires"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Maires
                </Link>
              </li>
              <li>
                <Link
                  to="/groupes"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Groupes politiques
                </Link>
              </li>
              <li>
                <Link
                  to="/lois"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Lois
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations légales */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Informations
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/a-propos"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  to="/mentions-legales"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  to="/mentions-legales#confidentialite"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/politiquefr/politiquefr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                >
                  Code source
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              © {anneeActuelle} PolitiqueFR. Données publiques, réutilisation libre.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 md:mt-0">
              Ce site n'utilise pas de cookies de traçage.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
