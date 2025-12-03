import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function GroupeDetailPage() {
  return (
    <>
      <Helmet><title>Détail Groupe - PolitiqueFR</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/groupes" className="link mb-4 inline-block">← Retour</Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Détail du groupe</h1>
        <p className="text-gray-500 mt-4">Page en cours de développement.</p>
      </div>
    </>
  );
}
