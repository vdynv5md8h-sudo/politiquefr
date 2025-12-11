import { TravauxParlementaire } from '../../types';
import TravauxCard from './TravauxCard';
import Chargement from '../common/Chargement';

interface TravauxListProps {
  travaux: TravauxParlementaire[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function TravauxList({
  travaux,
  isLoading = false,
  emptyMessage = 'Aucun travail parlementaire trouvé',
}: TravauxListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Chargement taille="lg" />
      </div>
    );
  }

  if (travaux.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {travaux.map((item) => (
        <TravauxCard key={item.id} travaux={item} />
      ))}
    </div>
  );
}
