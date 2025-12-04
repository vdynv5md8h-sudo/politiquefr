import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface Loi {
  id: string;
  titre: string;
  titreCourt?: string;
  statut: string;
  type: string;
  dateDepot: string;
}

interface LoisEnCoursProps {
  lois: Loi[];
}

const statutConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  EN_SEANCE: {
    label: 'En seance',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: ChatBubbleLeftRightIcon,
  },
  EN_COMMISSION: {
    label: 'En commission',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: ArrowPathIcon,
  },
  DEPOT: {
    label: 'Depose',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: DocumentTextIcon,
  },
};

export default function LoisEnCours({ lois }: LoisEnCoursProps) {
  if (!lois || lois.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucune loi en cours de discussion
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lois.map((loi) => {
        const config = statutConfig[loi.statut] || statutConfig.DEPOT;
        const Icon = config.icon;

        return (
          <Link
            key={loi.id}
            to={`/lois/${loi.id}`}
            className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {loi.titreCourt || loi.titre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {loi.type.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
      <Link
        to="/lois"
        className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 pt-2"
      >
        Voir toutes les lois
      </Link>
    </div>
  );
}
