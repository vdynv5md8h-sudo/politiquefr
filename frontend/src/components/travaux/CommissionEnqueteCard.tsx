import { Link } from 'react-router-dom';
import { CommissionEnquete, StatutCommissionEnquete } from '../../types';

interface CommissionEnqueteCardProps {
  commission: CommissionEnquete;
}

const STATUT_CONFIG: Record<StatutCommissionEnquete, { label: string; color: string }> = {
  EN_COURS: {
    label: 'En cours',
    color: 'bg-green-100 text-green-700',
  },
  TERMINE: {
    label: 'Terminée',
    color: 'bg-gray-100 text-gray-700',
  },
  RAPPORT_DEPOSE: {
    label: 'Rapport déposé',
    color: 'bg-blue-100 text-blue-700',
  },
  ARCHIVE: {
    label: 'Archivée',
    color: 'bg-gray-200 text-gray-600',
  },
};

export default function CommissionEnqueteCard({ commission }: CommissionEnqueteCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const statutConfig = STATUT_CONFIG[commission.statut];
  const resumeCourt = commission.resumes?.find((r) => r.typeResume === 'COURT');

  return (
    <Link
      to={`/commissions-enquete/${commission.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all duration-200"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase">
              Commission d'enquête
            </span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutConfig.color}`}>
            {statutConfig.label}
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {commission.titre}
        </h3>

        {/* Sujet */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {resumeCourt?.contenu || commission.sujet}
        </p>

        {/* Infos */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(commission.dateCreation)}
          </span>

          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            {commission.chambre === 'ASSEMBLEE' ? 'Assemblée' : 'Sénat'}
          </span>

          {commission.nombreMembres && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {commission.nombreMembres} membres
            </span>
          )}
        </div>

        {/* Footer */}
        {commission.urlRapportFinal && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Rapport final disponible
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
