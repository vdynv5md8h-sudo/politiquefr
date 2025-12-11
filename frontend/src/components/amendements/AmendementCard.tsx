import { Link } from 'react-router-dom';
import { Amendement, AuteurAmendement, SortAmendement } from '../../types';

interface AmendementCardProps {
  amendement: Amendement;
}

const SORT_CONFIG: Record<SortAmendement, { label: string; bgColor: string; textColor: string }> = {
  ADOPTE: { label: 'Adopté', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  REJETE: { label: 'Rejeté', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  RETIRE: { label: 'Retiré', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  TOMBE: { label: 'Tombé', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  IRRECEVABLE: { label: 'Irrecevable', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  NON_SOUTENU: { label: 'Non soutenu', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  EN_COURS: { label: 'En cours', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
};

function parseAuteurs(auteursJson?: string): AuteurAmendement[] {
  if (!auteursJson) return [];
  try {
    return JSON.parse(auteursJson);
  } catch {
    return [];
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AmendementCard({ amendement }: AmendementCardProps) {
  const sortConfig = SORT_CONFIG[amendement.sort] || SORT_CONFIG.EN_COURS;
  const auteurs = parseAuteurs(amendement.auteurs);
  const auteurPrincipal = auteurs[0];
  const nombreCosignataires = auteurs.length - 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header with numero and sort status */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <Link
              to={`/amendements/${amendement.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
            >
              Amendement n°{amendement.numero}
            </Link>
            <div className="text-sm text-gray-500 mt-0.5">
              {formatDate(amendement.dateDepot)}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sortConfig.bgColor} ${sortConfig.textColor}`}
          >
            {sortConfig.label}
          </span>
        </div>

        {/* Linked travaux */}
        {amendement.travaux && (
          <div className="mb-3">
            <Link
              to={`/travaux/${amendement.travaux.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline line-clamp-2"
            >
              {amendement.travaux.titreCourt || amendement.travaux.titre}
            </Link>
          </div>
        )}

        {/* Expose sommaire (truncated) */}
        {amendement.exposeSommaire && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {amendement.exposeSommaire.replace(/<[^>]*>/g, '')}
          </p>
        )}

        {/* Author info */}
        {auteurPrincipal && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            {auteurPrincipal.groupeCouleur && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: auteurPrincipal.groupeCouleur }}
              />
            )}
            <span className="text-sm text-gray-700">
              {auteurPrincipal.prenom} {auteurPrincipal.nom}
              {auteurPrincipal.groupeAcronyme && (
                <span className="text-gray-500 ml-1">({auteurPrincipal.groupeAcronyme})</span>
              )}
            </span>
            {nombreCosignataires > 0 && (
              <span className="text-sm text-gray-500">
                +{nombreCosignataires} cosignataire{nombreCosignataires > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* External link */}
        {amendement.urlAmendement && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <a
              href={amendement.urlAmendement}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
            >
              Voir sur assemblee-nationale.fr
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
