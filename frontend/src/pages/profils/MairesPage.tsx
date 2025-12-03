import { Helmet } from 'react-helmet-async';

export default function MairesPage() {
  return (
    <>
      <Helmet><title>Maires - PolitiqueFR</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Maires de France</h1>
        <p className="text-gray-600 dark:text-gray-400">Liste des maires des communes françaises.</p>
        <div className="mt-8 card p-8 text-center">
          <p className="text-gray-500">Page en cours de développement.</p>
          <p className="text-sm text-gray-400 mt-2">~35 000 maires seront affichés après synchronisation avec data.gouv.fr</p>
        </div>
      </div>
    </>
  );
}
