import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { groupesApi } from '@/services/api';
import { Link } from 'react-router-dom';

export default function GroupesPage() {
  const { data } = useQuery({ queryKey: ['groupes-composition'], queryFn: groupesApi.composition });
  const composition = data?.donnees as { assemblee?: Array<{id: string; acronyme: string; nom: string; couleur?: string; nombreMembres: number}>; senat?: Array<{id: string; acronyme: string; nom: string; couleur?: string; nombreMembres: number}> } | undefined;

  return (
    <>
      <Helmet><title>Groupes politiques - PolitiqueFR</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Groupes politiques</h1>
        
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Assemblée nationale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {composition?.assemblee?.map((g) => (
            <Link key={g.id} to={`/groupes/${g.id}`} className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: g.couleur || '#6b7280' }} />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{g.acronyme}</div>
                  <div className="text-sm text-gray-500">{g.nom}</div>
                </div>
                <div className="ml-auto text-lg font-bold text-gray-700 dark:text-gray-300">{g.nombreMembres}</div>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Sénat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {composition?.senat?.map((g) => (
            <Link key={g.id} to={`/groupes/${g.id}`} className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: g.couleur || '#6b7280' }} />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{g.acronyme}</div>
                  <div className="text-sm text-gray-500">{g.nom}</div>
                </div>
                <div className="ml-auto text-lg font-bold text-gray-700 dark:text-gray-300">{g.nombreMembres}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
