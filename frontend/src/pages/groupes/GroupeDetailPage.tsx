import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { groupesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { GroupePolitique, Chambre } from '@/types';
import {
  UserGroupIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  ChartBarIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface MembreGroupe {
  id: string;
  civilite: string;
  prenom: string;
  nom: string;
  departement: string;
  photoUrl?: string;
}

interface MembresResponse {
  chambre: Chambre;
  membres: MembreGroupe[];
}

interface VotesStats {
  pour: number;
  contre: number;
  abstention: number;
}

interface GroupeDetail extends GroupePolitique {
  _count?: {
    deputes: number;
    senateurs: number;
  };
}

// Données enrichies sur les groupes politiques
const GROUPES_INFO: Record<string, {
  fondation?: string;
  president?: string;
  ideologie?: string;
  affiliation?: string;
  description?: string;
}> = {
  // Assemblée nationale
  'RN': {
    fondation: '2018 (anciennement Front National)',
    president: 'Marine Le Pen',
    ideologie: 'Nationalisme, Souverainisme, Conservatisme',
    affiliation: 'Identité et Démocratie (UE)',
    description: 'Le Rassemblement National est un parti politique français d\'extrême droite fondé en 1972 sous le nom de Front National. Il défend une politique de souveraineté nationale, de contrôle de l\'immigration et de protectionnisme économique.',
  },
  'EPR': {
    fondation: '2022 (Renaissance)',
    president: 'Gabriel Attal',
    ideologie: 'Libéralisme, Progressisme, Pro-européisme',
    affiliation: 'Renew Europe (UE)',
    description: 'Ensemble pour la République (anciennement Renaissance) est le groupe parlementaire du mouvement présidentiel. Il rassemble les partis soutenant Emmanuel Macron et prône une politique libérale et européiste.',
  },
  'LFI-NFP': {
    fondation: '2016 (La France Insoumise)',
    president: 'Jean-Luc Mélenchon (fondateur)',
    ideologie: 'Socialisme démocratique, Écosocialisme, Euroscepticisme de gauche',
    affiliation: 'La Gauche (UE)',
    description: 'La France Insoumise - Nouveau Front Populaire représente la gauche radicale à l\'Assemblée nationale. Le mouvement défend une VIe République, la planification écologique et une politique sociale ambitieuse.',
  },
  'SOC': {
    fondation: '1969',
    president: 'Boris Vallaud',
    ideologie: 'Social-démocratie, Socialisme démocratique',
    affiliation: 'Alliance Progressiste des Socialistes et Démocrates (UE)',
    description: 'Le groupe socialiste à l\'Assemblée nationale rassemble les députés du Parti Socialiste et apparentés. Il défend les valeurs de justice sociale, de solidarité et d\'égalité.',
  },
  'DR': {
    fondation: '2023',
    ideologie: 'Conservatisme, Libéralisme économique',
    affiliation: 'Parti Populaire Européen (UE)',
    description: 'Droite Républicaine est le groupe parlementaire des Républicains à l\'Assemblée nationale. Il défend des valeurs de droite traditionnelle : autorité de l\'État, sécurité, et libéralisme économique.',
  },
  'DEMO': {
    fondation: '2017 (MoDem)',
    president: 'François Bayrou (fondateur)',
    ideologie: 'Centrisme, Libéralisme social, Pro-européisme',
    affiliation: 'Renew Europe (UE)',
    description: 'Les Démocrates est le groupe du Mouvement Démocrate à l\'Assemblée. Il défend une politique centriste, européenne et attachée aux libertés individuelles.',
  },
  'HOR': {
    fondation: '2017',
    president: 'Édouard Philippe',
    ideologie: 'Centre-droit, Libéralisme',
    affiliation: 'Renew Europe (UE)',
    description: 'Horizons et apparentés représente le parti fondé par Édouard Philippe. Il défend une vision pragmatique de la politique, alliant réformes économiques et engagement européen.',
  },
  'ECO': {
    fondation: '2012',
    ideologie: 'Écologie politique, Altermondialisme',
    affiliation: 'Verts/ALE (UE)',
    description: 'Le groupe Écologiste rassemble les députés écologistes. Ils défendent la transition écologique, la justice sociale et environnementale.',
  },
  'GDR': {
    fondation: '1962 (PCF)',
    ideologie: 'Communisme, Socialisme',
    affiliation: 'La Gauche (UE)',
    description: 'Gauche Démocrate et Républicaine est le groupe du Parti Communiste Français et ultramarins. Il défend les travailleurs, les services publics et la souveraineté populaire.',
  },
  'LIOT': {
    fondation: '2017',
    ideologie: 'Divers, Territorialisme',
    description: 'Libertés, Indépendants, Outre-mer et Territoires rassemble des députés sans étiquette défendant les territoires et les outre-mer.',
  },
  'UDR': {
    fondation: '2024',
    ideologie: 'Droite conservatrice',
    description: 'L\'Union des Droites pour la République est un groupe récent rassemblant des élus de droite.',
  },
  'NI': {
    description: 'Les députés non-inscrits ne sont rattachés à aucun groupe parlementaire.',
  },
  // Sénat
  'LR': {
    fondation: '2015 (ex-UMP)',
    president: 'Bruno Retailleau (groupe sénatorial)',
    ideologie: 'Conservatisme, Gaullisme, Libéralisme économique',
    affiliation: 'Parti Populaire Européen (UE)',
    description: 'Les Républicains sont le principal parti de droite au Sénat. Ils défendent l\'autorité de l\'État, la sécurité et le libéralisme économique.',
  },
  'SER': {
    fondation: '1946',
    ideologie: 'Social-démocratie',
    description: 'Le groupe Socialiste, Écologiste et Républicain est le principal groupe de gauche au Sénat.',
  },
  'UC': {
    fondation: '1959',
    ideologie: 'Centrisme, Démocratie chrétienne',
    description: 'L\'Union Centriste rassemble les sénateurs centristes, notamment de l\'UDI et du MoDem.',
  },
  'CRCE-K': {
    ideologie: 'Communisme, Socialisme',
    description: 'Le groupe Communiste, Républicain, Citoyen et Écologiste - Kanaky rassemble les sénateurs communistes et ultramarins.',
  },
  'RDSE': {
    fondation: '1892',
    ideologie: 'Radicalisme, Centrisme',
    description: 'Le Rassemblement Démocratique et Social Européen est le plus ancien groupe du Sénat, héritier du radicalisme français.',
  },
  'RDPI': {
    fondation: '2017',
    ideologie: 'Libéralisme, Macronisme',
    description: 'Rassemblement des démocrates, progressistes et indépendants représente la majorité présidentielle au Sénat.',
  },
  'GEST': {
    ideologie: 'Écologie politique',
    description: 'Le groupe Écologiste - Solidarité et Territoires défend la transition écologique au Sénat.',
  },
  'INDEP': {
    ideologie: 'Libéralisme',
    description: 'Les Indépendants - République et Territoires rassemblent des sénateurs libéraux.',
  },
};

function getPositionColor(position?: string): string {
  switch (position) {
    case 'Extrême gauche':
      return 'bg-red-700';
    case 'Gauche':
      return 'bg-red-500';
    case 'Centre-gauche':
      return 'bg-pink-500';
    case 'Centre':
      return 'bg-yellow-500';
    case 'Centre-droit':
      return 'bg-blue-400';
    case 'Droite':
      return 'bg-blue-600';
    case 'Extrême droite':
      return 'bg-blue-900';
    default:
      return 'bg-gray-500';
  }
}

function getChambreLabel(chambre: Chambre): string {
  return chambre === 'ASSEMBLEE' ? 'Assemblée nationale' : 'Sénat';
}

function getMembreLink(chambre: Chambre, id: string): string {
  return chambre === 'ASSEMBLEE' ? `/deputes/${id}` : `/senateurs/${id}`;
}

export default function GroupeDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Récupérer les détails du groupe
  const { data: groupeData, isLoading: isLoadingGroupe, error: errorGroupe } = useQuery({
    queryKey: ['groupe', id],
    queryFn: () => groupesApi.detail(id!),
    enabled: !!id,
  });

  // Récupérer les membres du groupe
  const { data: membresData, isLoading: isLoadingMembres } = useQuery({
    queryKey: ['groupe', id, 'membres'],
    queryFn: () => groupesApi.membres(id!),
    enabled: !!id,
  });

  // Récupérer les statistiques de votes du groupe
  const { data: votesData } = useQuery({
    queryKey: ['groupe', id, 'votes'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/groupes/${id}/votes`);
      const data = await response.json();
      return data.donnees as VotesStats;
    },
    enabled: !!id,
  });

  const groupe = groupeData?.donnees as GroupeDetail | undefined;
  const membresResponse = membresData?.donnees as MembresResponse | undefined;
  const membres = membresResponse?.membres || [];
  const votes = votesData;

  // Informations enrichies
  const infoGroupe = groupe ? GROUPES_INFO[groupe.acronyme] : undefined;

  if (isLoadingGroupe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Chargement taille="lg" texte="Chargement du groupe..." />
      </div>
    );
  }

  if (errorGroupe || !groupe) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Groupe non trouvé
        </h1>
        <Link to="/groupes" className="link">
          Retour à la liste des groupes
        </Link>
      </div>
    );
  }

  // Calculer le total des votes
  const totalVotes = votes ? votes.pour + votes.contre + votes.abstention : 0;
  const pourcentagePour = totalVotes > 0 ? ((votes?.pour || 0) / totalVotes * 100).toFixed(1) : '0';
  const pourcentageContre = totalVotes > 0 ? ((votes?.contre || 0) / totalVotes * 100).toFixed(1) : '0';
  const pourcentageAbstention = totalVotes > 0 ? ((votes?.abstention || 0) / totalVotes * 100).toFixed(1) : '0';

  // Répartition géographique des membres
  const repartitionGeo = membres.reduce((acc, m) => {
    acc[m.departement] = (acc[m.departement] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topDepartements = Object.entries(repartitionGeo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <Helmet>
        <title>{groupe.acronyme} - {groupe.nom} - PolitiqueFR</title>
        <meta
          name="description"
          content={`${groupe.nom} (${groupe.acronyme}) - Groupe politique de ${getChambreLabel(groupe.chambre)}. ${groupe.nombreMembres} membres. ${infoGroupe?.ideologie || groupe.positionPolitique || ''}`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: groupe.nom,
            alternateName: groupe.acronyme,
            description: infoGroupe?.description || groupe.description,
            url: groupe.siteWeb || undefined,
            logo: groupe.logoUrl || undefined,
            memberOf: {
              '@type': 'Organization',
              name: getChambreLabel(groupe.chambre),
            },
          })}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lien retour */}
        <Link to="/groupes" className="link mb-4 inline-block">
          ← Retour aux groupes politiques
        </Link>

        {/* En-tête du groupe */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo ou Acronyme */}
            <div className="flex-shrink-0">
              {groupe.logoUrl ? (
                <img
                  src={groupe.logoUrl}
                  alt={groupe.nom}
                  className="w-24 h-24 rounded-xl object-contain bg-white p-2"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: groupe.couleur || '#6B7280' }}
                >
                  <span className="text-2xl font-bold text-white">
                    {groupe.acronyme}
                  </span>
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {groupe.nom}
                </h1>
                <span
                  className="badge text-sm text-white"
                  style={{ backgroundColor: groupe.couleur || '#6B7280' }}
                >
                  {groupe.acronyme}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <div className="flex items-center">
                  <BuildingLibraryIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {getChambreLabel(groupe.chambre)}
                  </span>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {groupe.nombreMembres} membre{groupe.nombreMembres > 1 ? 's' : ''}
                  </span>
                </div>
                {groupe.positionPolitique && (
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${getPositionColor(groupe.positionPolitique)}`} />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {groupe.positionPolitique}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {(infoGroupe?.description || groupe.description) && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {infoGroupe?.description || groupe.description}
                </p>
              )}

              {/* Liens */}
              <div className="flex flex-wrap gap-3">
                {groupe.siteWeb && (
                  <a
                    href={groupe.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Site officiel
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{groupe.nombreMembres}</div>
            <div className="text-sm text-gray-500">Membres</div>
          </div>
          {infoGroupe?.fondation && (
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-green-600">{infoGroupe.fondation.split(' ')[0]}</div>
              <div className="text-sm text-gray-500">Fondation</div>
            </div>
          )}
          {infoGroupe?.president && (
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-purple-600 truncate">{infoGroupe.president}</div>
              <div className="text-sm text-gray-500">Figure principale</div>
            </div>
          )}
          {topDepartements.length > 0 && (
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-orange-600">{topDepartements[0][0]}</div>
              <div className="text-sm text-gray-500">Département principal</div>
            </div>
          )}
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Informations du groupe */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BuildingLibraryIcon className="h-5 w-5 mr-2" />
              Informations
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Chambre</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getChambreLabel(groupe.chambre)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Acronyme</span>
                <span className="font-medium text-gray-900 dark:text-white">{groupe.acronyme}</span>
              </div>
              {groupe.positionPolitique && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Position politique</span>
                  <span className="font-medium text-gray-900 dark:text-white">{groupe.positionPolitique}</span>
                </div>
              )}
              {(infoGroupe?.ideologie || groupe.ideologie) && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Idéologie</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                    {infoGroupe?.ideologie || groupe.ideologie}
                  </span>
                </div>
              )}
              {infoGroupe?.fondation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fondation</span>
                  <span className="font-medium text-gray-900 dark:text-white">{infoGroupe.fondation}</span>
                </div>
              )}
              {infoGroupe?.affiliation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Affiliation européenne</span>
                  <span className="font-medium text-gray-900 dark:text-white">{infoGroupe.affiliation}</span>
                </div>
              )}
              {groupe.dateCreation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de création</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(groupe.dateCreation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className={`font-medium ${groupe.actif ? 'text-green-600' : 'text-red-600'}`}>
                  {groupe.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Tendances de vote */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Tendances de vote
            </h2>
            {votes && totalVotes > 0 ? (
              <div className="space-y-4">
                {/* Pour */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1 text-green-500" />
                      Pour
                    </span>
                    <span className="font-medium">{votes.pour.toLocaleString('fr-FR')} ({pourcentagePour}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${pourcentagePour}%` }}
                    />
                  </div>
                </div>

                {/* Contre */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center">
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1 text-red-500" />
                      Contre
                    </span>
                    <span className="font-medium">{votes.contre.toLocaleString('fr-FR')} ({pourcentageContre}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${pourcentageContre}%` }}
                    />
                  </div>
                </div>

                {/* Abstention */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Abstention</span>
                    <span className="font-medium">{votes.abstention.toLocaleString('fr-FR')} ({pourcentageAbstention}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gray-400 h-3 rounded-full"
                      style={{ width: `${pourcentageAbstention}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-4">
                  Total : {totalVotes.toLocaleString('fr-FR')} votes comptabilisés
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune donnée de vote disponible.</p>
            )}
          </div>
        </div>

        {/* Répartition géographique */}
        {topDepartements.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Répartition géographique (top 5)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topDepartements.map(([dept, count], index) => (
                <div key={dept} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold" style={{ color: groupe.couleur || '#3B82F6' }}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-500 truncate" title={dept}>
                    {index + 1}. {dept}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des membres */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Membres du groupe ({membres.length})
          </h2>

          {isLoadingMembres ? (
            <Chargement taille="md" texte="Chargement des membres..." />
          ) : membres.length === 0 ? (
            <p className="text-gray-500">Aucun membre trouvé pour ce groupe.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {membres.map((membre) => (
                <Link
                  key={membre.id}
                  to={getMembreLink(groupe.chambre, membre.id)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {membre.photoUrl ? (
                    <img
                      src={membre.photoUrl}
                      alt={`${membre.prenom} ${membre.nom}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: groupe.couleur || '#6B7280' }}
                    >
                      {membre.prenom?.[0]}{membre.nom?.[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {membre.civilite} {membre.prenom} {membre.nom}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {membre.departement}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sources : {groupe.chambre === 'ASSEMBLEE' ? 'Assemblée nationale, nosdeputes.fr' : 'Sénat'}
        </div>
      </div>
    </>
  );
}
