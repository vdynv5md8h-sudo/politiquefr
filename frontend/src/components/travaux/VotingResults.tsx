import type { ScrutinLight } from '../../types';

interface VotingResultsProps {
  scrutins: ScrutinLight[];
}

export default function VotingResults({ scrutins }: VotingResultsProps) {
  if (!scrutins || scrutins.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Votes
      </h2>

      <div className="space-y-6">
        {scrutins.map((scrutin) => {
          const total = scrutin.pour + scrutin.contre + scrutin.abstention;
          const pourPct = total > 0 ? (scrutin.pour / total) * 100 : 0;
          const contrePct = total > 0 ? (scrutin.contre / total) * 100 : 0;
          const abstentionPct = total > 0 ? (scrutin.abstention / total) * 100 : 0;

          return (
            <div key={scrutin.id} className="border border-gray-100 rounded-lg p-4">
              {/* Scrutin header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {scrutin.titre}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Scrutin n°{scrutin.numeroScrutin} - {formatDate(scrutin.dateScrutin)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-bold rounded-full ${
                    scrutin.resultat === 'ADOPTE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {scrutin.resultat === 'ADOPTE' ? 'Adopté' : 'Rejeté'}
                </span>
              </div>

              {/* Vote bar */}
              <div className="h-6 flex rounded-full overflow-hidden mb-3">
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${pourPct}%` }}
                >
                  {pourPct > 10 && `${scrutin.pour}`}
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${contrePct}%` }}
                >
                  {contrePct > 10 && `${scrutin.contre}`}
                </div>
                <div
                  className="bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-medium"
                  style={{ width: `${abstentionPct}%` }}
                >
                  {abstentionPct > 10 && `${scrutin.abstention}`}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5" />
                  <span className="text-gray-600">Pour: </span>
                  <span className="font-semibold text-gray-900 ml-1">{scrutin.pour}</span>
                  <span className="text-gray-400 ml-1">({pourPct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5" />
                  <span className="text-gray-600">Contre: </span>
                  <span className="font-semibold text-gray-900 ml-1">{scrutin.contre}</span>
                  <span className="text-gray-400 ml-1">({contrePct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-1.5" />
                  <span className="text-gray-600">Abstention: </span>
                  <span className="font-semibold text-gray-900 ml-1">{scrutin.abstention}</span>
                  <span className="text-gray-400 ml-1">({abstentionPct.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Total votants */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {scrutin.nombreVotants} votants
                </span>
                {scrutin.urlScrutin && (
                  <a
                    href={scrutin.urlScrutin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Voir le détail
                    <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
