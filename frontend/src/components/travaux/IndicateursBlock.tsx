import { IndicateurStatistique } from '../../types';

interface IndicateursBlockProps {
  indicateurs: IndicateurStatistique[];
}

export default function IndicateursBlock({ indicateurs }: IndicateursBlockProps) {
  if (!indicateurs || indicateurs.length === 0) {
    return null;
  }

  const formatNumber = (value: number | undefined, unite?: string) => {
    if (value === undefined || value === null) return 'N/A';

    const formatted = value.toLocaleString('fr-FR', {
      maximumFractionDigits: 1,
    });

    return unite ? `${formatted} ${unite}` : formatted;
  };

  const formatVariation = (variation: number | undefined) => {
    if (variation === undefined || variation === null) return null;

    const isPositive = variation > 0;
    const isNegative = variation < 0;

    return (
      <span
        className={`text-xs ${
          isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
        }`}
      >
        {isPositive && '+'}
        {variation.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Indicateurs clés (INSEE)
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {indicateurs.map((indicateur) => (
          <div
            key={indicateur.id}
            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="text-xs text-gray-500 mb-1">{indicateur.nom}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(indicateur.valeurActuelle, indicateur.unite)}
              </span>
              {formatVariation(indicateur.variationAnnuelle)}
            </div>
            {indicateur.dateValeur && (
              <div className="text-xs text-gray-400 mt-1">
                {new Date(indicateur.dateValeur).toLocaleDateString('fr-FR', {
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Source : INSEE
      </div>
    </div>
  );
}
