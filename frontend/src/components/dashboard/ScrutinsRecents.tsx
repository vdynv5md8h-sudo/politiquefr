import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Scrutin {
  id: string;
  titre: string;
  dateScrutin: string;
  resultat: 'ADOPTE' | 'REJETE' | null;
  chambre: 'ASSEMBLEE' | 'SENAT';
  pour: number;
  contre: number;
  abstention: number;
  loi?: {
    id: string;
    titre: string;
    titreCourt?: string;
  } | null;
}

interface ScrutinsRecentsProps {
  scrutins: Scrutin[];
}

export default function ScrutinsRecents({ scrutins }: ScrutinsRecentsProps) {
  if (!scrutins || scrutins.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucun scrutin recent
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scrutins.map((scrutin) => (
        <Link
          key={scrutin.id}
          to={`/scrutins/${scrutin.id}`}
          className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  scrutin.chambre === 'ASSEMBLEE'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {scrutin.chambre === 'ASSEMBLEE' ? 'AN' : 'Senat'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(scrutin.dateScrutin).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                {scrutin.titre}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="text-green-600">Pour: {scrutin.pour}</span>
                <span className="text-red-600">Contre: {scrutin.contre}</span>
                {scrutin.abstention > 0 && (
                  <span>Abst: {scrutin.abstention}</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {scrutin.resultat === 'ADOPTE' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : scrutin.resultat === 'REJETE' ? (
                <XCircleIcon className="h-6 w-6 text-red-600" />
              ) : (
                <ClockIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>
        </Link>
      ))}
      <Link
        to="/scrutins"
        className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 pt-2"
      >
        Voir tous les scrutins
      </Link>
    </div>
  );
}
