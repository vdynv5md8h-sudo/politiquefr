import { StatutExamenTravaux } from '../../types';

export interface TravauxFiltersState {
  statut?: StatutExamenTravaux;
  legislature?: number;
}

interface TravauxFiltersProps {
  filters: TravauxFiltersState;
  onFilterChange: (filters: TravauxFiltersState) => void;
}

const STATUT_OPTIONS: { value: StatutExamenTravaux | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COMMISSION', label: 'En commission' },
  { value: 'EN_SEANCE', label: 'En séance' },
  { value: 'PREMIERE_LECTURE_AN', label: '1ère lecture AN' },
  { value: 'PREMIERE_LECTURE_SENAT', label: '1ère lecture Sénat' },
  { value: 'DEUXIEME_LECTURE', label: '2ème lecture' },
  { value: 'CMP', label: 'CMP' },
  { value: 'LECTURE_DEFINITIVE', label: 'Lecture définitive' },
  { value: 'ADOPTE', label: 'Adopté' },
  { value: 'PROMULGUE', label: 'Promulgué' },
  { value: 'REJETE', label: 'Rejeté' },
  { value: 'RETIRE', label: 'Retiré' },
  { value: 'CADUQUE', label: 'Caduque' },
];

const LEGISLATURE_OPTIONS = [
  { value: '', label: 'Toutes les législatures' },
  { value: 17, label: '17e législature (2024-)' },
  { value: 16, label: '16e législature (2022-2024)' },
  { value: 15, label: '15e législature (2017-2022)' },
  { value: 14, label: '14e législature (2012-2017)' },
];

export default function TravauxFilters({ filters, onFilterChange }: TravauxFiltersProps) {
  const hasFilters = filters.statut || filters.legislature;

  const handleStatutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as StatutExamenTravaux | '';
    onFilterChange({
      ...filters,
      statut: value || undefined,
    });
  };

  const handleLegislatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      legislature: value ? parseInt(value) : undefined,
    });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">Filtres</span>
      </div>

      <select
        value={filters.statut || ''}
        onChange={handleStatutChange}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {STATUT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={filters.legislature || ''}
        onChange={handleLegislatureChange}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {LEGISLATURE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Réinitialiser
        </button>
      )}

      {hasFilters && (
        <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
          {[filters.statut, filters.legislature].filter(Boolean).length} filtre(s) actif(s)
        </span>
      )}
    </div>
  );
}
