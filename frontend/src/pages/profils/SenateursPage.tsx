import { Helmet } from 'react-helmet-async';

export default function SenateursPage() {
  return (
    <>
      <Helmet>
        <title>Sénateurs - PolitiqueFR</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Sénateurs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Liste des 348 sénateurs du Sénat français.
        </p>
        <div className="mt-8 card p-8 text-center">
          <p className="text-gray-500">Page en cours de développement.</p>
          <p className="text-sm text-gray-400 mt-2">
            Les données seront affichées après synchronisation avec data.senat.fr
          </p>
        </div>
      </div>
    </>
  );
}
