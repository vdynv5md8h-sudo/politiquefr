import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { travauxApi, commissionsEnqueteApi } from '../../services/api';
import { TravauxParlementaire, CommissionEnquete, Pagination } from '../../types';
import TravauxList from '../../components/travaux/TravauxList';
import CommissionEnqueteCard from '../../components/travaux/CommissionEnqueteCard';
import Chargement from '../../components/common/Chargement';

type TabId = 'tous' | 'projets' | 'propositions' | 'adoptes' | 'commissions';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    id: 'tous',
    label: 'Tous les travaux',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    id: 'projets',
    label: 'Projets de loi',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    id: 'propositions',
    label: 'Propositions de loi',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: 'adoptes',
    label: 'Textes adoptés',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'commissions',
    label: "Commissions d'enquête",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
];

export default function TravauxParlementairesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('tous');
  const [page, setPage] = useState(1);
  const limite = 12;

  // Queries pour chaque onglet
  const travauxQuery = useQuery({
    queryKey: ['travaux', 'liste', page, limite],
    queryFn: () => travauxApi.liste({ page, limite }),
    enabled: activeTab === 'tous',
  });

  const projetsQuery = useQuery({
    queryKey: ['travaux', 'projets', page, limite],
    queryFn: () => travauxApi.projetsLoi({ page, limite }),
    enabled: activeTab === 'projets',
  });

  const propositionsQuery = useQuery({
    queryKey: ['travaux', 'propositions', page, limite],
    queryFn: () => travauxApi.propositionsLoi({ page, limite }),
    enabled: activeTab === 'propositions',
  });

  const adoptesQuery = useQuery({
    queryKey: ['travaux', 'adoptes', page, limite],
    queryFn: () => travauxApi.textesAdoptes({ page, limite }),
    enabled: activeTab === 'adoptes',
  });

  const commissionsQuery = useQuery({
    queryKey: ['commissions-enquete', 'liste', page, limite],
    queryFn: () => commissionsEnqueteApi.liste({ page, limite }),
    enabled: activeTab === 'commissions',
  });

  // Stats
  const statsQuery = useQuery({
    queryKey: ['travaux', 'stats'],
    queryFn: () => travauxApi.stats(),
  });

  // Données actuelles selon l'onglet
  const getCurrentData = (): {
    data: TravauxParlementaire[] | CommissionEnquete[];
    pagination?: Pagination;
    isLoading: boolean;
  } => {
    switch (activeTab) {
      case 'tous':
        return {
          data: (travauxQuery.data?.donnees as TravauxParlementaire[]) || [],
          pagination: travauxQuery.data?.pagination,
          isLoading: travauxQuery.isLoading,
        };
      case 'projets':
        return {
          data: (projetsQuery.data?.donnees as TravauxParlementaire[]) || [],
          pagination: projetsQuery.data?.pagination,
          isLoading: projetsQuery.isLoading,
        };
      case 'propositions':
        return {
          data: (propositionsQuery.data?.donnees as TravauxParlementaire[]) || [],
          pagination: propositionsQuery.data?.pagination,
          isLoading: propositionsQuery.isLoading,
        };
      case 'adoptes':
        return {
          data: (adoptesQuery.data?.donnees as TravauxParlementaire[]) || [],
          pagination: adoptesQuery.data?.pagination,
          isLoading: adoptesQuery.isLoading,
        };
      case 'commissions':
        return {
          data: (commissionsQuery.data?.donnees as CommissionEnquete[]) || [],
          pagination: commissionsQuery.data?.pagination,
          isLoading: commissionsQuery.isLoading,
        };
      default:
        return { data: [], isLoading: false };
    }
  };

  const { data, pagination, isLoading } = getCurrentData();

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travaux parlementaires</h1>
        <p className="text-gray-600">
          Suivez l'activité législative de l'Assemblée nationale et du Sénat
        </p>
      </div>

      {/* Stats */}
      {statsQuery.data?.donnees && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {statsQuery.data.donnees.total}
            </div>
            <div className="text-sm text-gray-500">Total travaux</div>
          </div>
          {statsQuery.data.donnees.parStatut
            ?.filter((s) =>
              ['ADOPTE', 'PROMULGUE', 'EN_COMMISSION'].includes(s.statut)
            )
            .slice(0, 3)
            .map((stat) => (
              <div key={stat.statut} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-900">{stat.nombre}</div>
                <div className="text-sm text-gray-500">{stat.statut.replace(/_/g, ' ')}</div>
              </div>
            ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Chargement taille="lg" />
            </div>
          ) : activeTab === 'commissions' ? (
            // Commissions d'enquête
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data as CommissionEnquete[]).length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Aucune commission d'enquête trouvée
                </div>
              ) : (
                (data as CommissionEnquete[]).map((commission) => (
                  <CommissionEnqueteCard key={commission.id} commission={commission} />
                ))
              )}
            </div>
          ) : (
            // Travaux parlementaires
            <TravauxList
              travaux={data as TravauxParlementaire[]}
              isLoading={isLoading}
              emptyMessage="Aucun travail parlementaire trouvé"
            />
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
