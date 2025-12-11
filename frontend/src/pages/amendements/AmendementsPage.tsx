import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { amendementsApi } from '../../services/api';
import { Amendement, SortAmendement, Pagination } from '../../types';
import AmendementCard from '../../components/amendements/AmendementCard';
import Chargement from '../../components/common/Chargement';

type TabId = 'tous' | 'adoptes' | 'rejetes' | 'en_cours';

interface TabConfig {
  id: TabId;
  label: string;
  sort?: SortAmendement;
}

const TABS: TabConfig[] = [
  { id: 'tous', label: 'Tous les amendements' },
  { id: 'adoptes', label: 'Adoptés', sort: 'ADOPTE' },
  { id: 'rejetes', label: 'Rejetés', sort: 'REJETE' },
  { id: 'en_cours', label: 'En cours', sort: 'EN_COURS' },
];

const LEGISLATURES = [17, 16, 15];

export default function AmendementsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('tous');
  const [page, setPage] = useState(1);
  const [legislature, setLegislature] = useState<number | undefined>(17);
  const limite = 12;

  const currentTab = TABS.find((t) => t.id === activeTab);

  const amendementsQuery = useQuery({
    queryKey: ['amendements', 'liste', page, limite, currentTab?.sort, legislature],
    queryFn: () =>
      amendementsApi.liste({
        page,
        limite,
        sort: currentTab?.sort,
        legislature,
        tri: 'dateDepot',
        ordre: 'desc',
      }),
  });

  const statsQuery = useQuery({
    queryKey: ['amendements', 'stats'],
    queryFn: () => amendementsApi.stats(),
  });

  const amendements = (amendementsQuery.data?.donnees as Amendement[]) || [];
  const pagination = amendementsQuery.data?.pagination as Pagination | undefined;
  const stats = statsQuery.data?.donnees;

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Amendements</h1>
        <p className="text-gray-600">
          Modifications proposées aux textes législatifs par les députés
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total amendements</div>
          </div>
          {stats.parSort
            ?.filter((s) => ['ADOPTE', 'REJETE', 'EN_COURS'].includes(s.sort))
            .map((stat) => (
              <div
                key={stat.sort}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="text-2xl font-bold text-gray-900">{stat.nombre}</div>
                <div className="text-sm text-gray-500">
                  {stat.sort === 'ADOPTE'
                    ? 'Adoptés'
                    : stat.sort === 'REJETE'
                    ? 'Rejetés'
                    : 'En cours'}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Legislature filter */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Législature :</label>
            <select
              value={legislature || ''}
              onChange={(e) => {
                setLegislature(e.target.value ? parseInt(e.target.value) : undefined);
                setPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes</option>
              {LEGISLATURES.map((leg) => (
                <option key={leg} value={leg}>
                  {leg}e législature
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {amendementsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Chargement taille="lg" />
            </div>
          ) : amendements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun amendement trouvé
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {amendements.map((amendement) => (
                <AmendementCard key={amendement.id} amendement={amendement} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.precedent}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.suivant}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
