import { useState } from 'react';
import { ResumeLLM, TypeResume } from '../../types';

interface ResumeSummaryProps {
  resumes: ResumeLLM[];
  onRegenerate?: (type: TypeResume) => Promise<void>;
  isRegenerating?: boolean;
}

const TYPE_LABELS: Record<TypeResume, { label: string; description: string }> = {
  COURT: {
    label: 'Court',
    description: '2-3 phrases',
  },
  MOYEN: {
    label: 'Standard',
    description: '1 paragraphe',
  },
  LONG: {
    label: 'Détaillé',
    description: 'Plusieurs paragraphes',
  },
  POINTS_CLES: {
    label: 'Points clés',
    description: 'Liste à puces',
  },
  VULGARISE: {
    label: 'Grand public',
    description: 'Simplifié',
  },
};

export default function ResumeSummary({
  resumes,
  onRegenerate,
  isRegenerating = false,
}: ResumeSummaryProps) {
  const [selectedType, setSelectedType] = useState<TypeResume>('MOYEN');

  const currentResume = resumes.find((r) => r.typeResume === selectedType);
  const availableTypes = resumes.map((r) => r.typeResume);

  const formatContent = (content: string, type: TypeResume) => {
    if (type === 'POINTS_CLES') {
      // Afficher comme liste
      const points = content.split('\n').filter((line) => line.trim());
      return (
        <ul className="list-disc list-inside space-y-2">
          {points.map((point, index) => (
            <li key={index} className="text-gray-700">
              {point.replace(/^[-•*]\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="prose prose-sm max-w-none text-gray-700">
        {content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-3">
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Résumé IA
        </h3>

        {/* Sélecteur de type */}
        <div className="flex gap-1">
          {(Object.keys(TYPE_LABELS) as TypeResume[]).map((type) => {
            const isAvailable = availableTypes.includes(type);
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                disabled={!isAvailable && !onRegenerate}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isAvailable
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
                title={TYPE_LABELS[type].description}
              >
                {TYPE_LABELS[type].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu du résumé */}
      <div className="min-h-[100px]">
        {currentResume ? (
          <>
            {formatContent(currentResume.contenu, currentResume.typeResume)}

            {/* Métadonnées */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Généré par {currentResume.modeleLLM} •{' '}
                {new Date(currentResume.updatedAt).toLocaleDateString('fr-FR')}
              </span>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(selectedType)}
                  disabled={isRegenerating}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {isRegenerating ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Régénération...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Régénérer
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-3">
              Aucun résumé "{TYPE_LABELS[selectedType].label}" disponible
            </p>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(selectedType)}
                disabled={isRegenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isRegenerating ? 'Génération en cours...' : 'Générer ce résumé'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
