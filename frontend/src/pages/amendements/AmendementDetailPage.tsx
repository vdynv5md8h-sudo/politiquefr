import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { amendementsApi } from '../../services/api';
import { Amendement, AuteurAmendement, SortAmendement } from '../../types';
import Chargement from '../../components/common/Chargement';

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
    month: 'long',
    year: 'numeric',
  });
}

export default function AmendementDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['amendement', id],
    queryFn: () => amendementsApi.detail(id!),
    enabled: !!id,
  });

  const amendement = data?.donnees as Amendement | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Chargement taille="lg" />
      </div>
    );
  }

  if (error || !amendement) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Amendement non trouvé</h2>
          <p className="text-red-600 mb-4">L'amendement demandé n'existe pas ou a été supprimé.</p>
          <Link
            to="/amendements"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retour aux amendements
          </Link>
        </div>
      </div>
    );
  }

  const sortConfig = SORT_CONFIG[amendement.sort] || SORT_CONFIG.EN_COURS;
  const auteurs = parseAuteurs(amendement.auteurs);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center gap-2 text-gray-500">
          <li>
            <Link to="/" className="hover:text-blue-600">
              Accueil
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/amendements" className="hover:text-blue-600">
              Amendements
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">n°{amendement.numero}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Amendement n°{amendement.numero}
            </h1>
            <div className="text-gray-500 mt-1">
              {amendement.uid} - {amendement.legislature}e législature
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sortConfig.bgColor} ${sortConfig.textColor}`}
          >
            {sortConfig.label}
          </span>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-sm text-gray-500">Date de dépôt</div>
            <div className="font-medium">{formatDate(amendement.dateDepot)}</div>
          </div>
          {amendement.dateDiscussion && (
            <div>
              <div className="text-sm text-gray-500">Date de discussion</div>
              <div className="font-medium">{formatDate(amendement.dateDiscussion)}</div>
            </div>
          )}
        </div>

        {/* External link */}
        {amendement.urlAmendement && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={amendement.urlAmendement}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

      {/* Linked travaux */}
      {amendement.travaux && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Texte législatif concerné</h2>
          <Link
            to={`/travaux/${amendement.travaux.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {amendement.travaux.titre}
          </Link>
        </div>
      )}

      {/* Authors */}
      {auteurs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {auteurs.length === 1 ? 'Auteur' : 'Auteurs'}
          </h2>
          <div className="space-y-3">
            {auteurs.map((auteur, index) => (
              <div key={auteur.acteurRef} className="flex items-center gap-3">
                {auteur.groupeCouleur && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: auteur.groupeCouleur }}
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {auteur.prenom} {auteur.nom}
                    {index === 0 && <span className="text-sm text-gray-500 ml-2">(auteur principal)</span>}
                  </div>
                  {auteur.groupeAcronyme && (
                    <div className="text-sm text-gray-500">{auteur.groupeAcronyme}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expose sommaire */}
      {amendement.exposeSommaire && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exposé sommaire</h2>
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: amendement.exposeSommaire }}
          />
        </div>
      )}

      {/* Dispositif */}
      {amendement.dispositif && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispositif</h2>
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: amendement.dispositif }}
          />
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link
          to="/amendements"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux amendements
        </Link>
      </div>
    </div>
  );
}
