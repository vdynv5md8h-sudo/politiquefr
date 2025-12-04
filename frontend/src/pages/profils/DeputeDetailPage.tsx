import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { deputesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Depute, VoteDepute, PositionVote } from '@/types';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  XMarkIcon,
  MinusIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

export default function DeputeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['depute', id],
    queryFn: () => deputesApi.detail(id!),
    enabled: !!id,
  });

  const { data: activiteData } = useQuery({
    queryKey: ['depute-activite', id],
    queryFn: () => deputesApi.activite(id!),
    enabled: !!id,
  });

  const { data: votesData } = useQuery({
    queryKey: ['depute-votes', id],
    queryFn: () => deputesApi.votes(id!, 1),
    enabled: !!id,
  });

  const depute = data?.donnees as Depute | undefined;
  const votesResponse = votesData?.donnees as { votes: VoteDepute[]; statistiques: Record<string, number> } | undefined;
  const votes = votesResponse?.votes || [];
  const statsVotes = votesResponse?.statistiques;
  const activite = activiteData?.donnees as {
    depute: Depute;
    moyennesAssemblee: Record<string, number | null>;
  } | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Chargement taille="lg" texte="Chargement du profil..." />
      </div>
    );
  }

  if (error || !depute) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Député non trouvé
        </h1>
        <Link to="/deputes" className="link">
          Retour à la liste des députés
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{depute.prenom} {depute.nom} - Député - PolitiqueFR</title>
        <meta
          name="description"
          content={`Profil de ${depute.civilite} ${depute.prenom} ${depute.nom}, député${depute.civilite === 'Mme' ? 'e' : ''} de ${depute.departement}.`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête du profil */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {depute.photoUrl ? (
                <img
                  src={depute.photoUrl}
                  alt={`${depute.prenom} ${depute.nom}`}
                  className="w-32 h-32 rounded-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">
                    {depute.prenom[0]}{depute.nom[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {depute.civilite} {depute.prenom} {depute.nom}
                </h1>
                {depute.groupe && (
                  <Link
                    to={`/groupes/${depute.groupe.id}`}
                    className="badge text-sm"
                    style={{
                      backgroundColor: depute.groupe.couleur ? `${depute.groupe.couleur}20` : '#e5e7eb',
                      color: depute.groupe.couleur || '#374151',
                    }}
                  >
                    {depute.groupe.acronyme}
                  </Link>
                )}
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Député{depute.civilite === 'Mme' ? 'e' : ''} de {depute.departement} ({depute.numeroCirconscription}e circonscription)
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Début du mandat :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(depute.dateDebutMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Législature :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {depute.legislature}e
                  </span>
                </div>
                {depute.profession && (
                  <div>
                    <span className="text-gray-500">Profession :</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {depute.profession}
                    </span>
                  </div>
                )}
              </div>

              {/* Liens */}
              <div className="flex flex-wrap gap-3 mt-4">
                {depute.email && (
                  <a
                    href={`mailto:${depute.email}`}
                    className="btn-outline text-sm"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    Email
                  </a>
                )}
                {depute.siteWeb && (
                  <a
                    href={depute.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Site web
                  </a>
                )}
                {depute.urlNosdeputes && (
                  <a
                    href={depute.urlNosdeputes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                    NosDéputés.fr
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques d'activité */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            titre="Présence en hémicycle"
            valeur={depute.presenceHemicycle}
            moyenne={activite?.moyennesAssemblee.presenceHemicycle}
            unite="%"
          />
          <StatCard
            titre="Présence en commission"
            valeur={depute.presenceCommission}
            moyenne={activite?.moyennesAssemblee.presenceCommission}
            unite="%"
          />
          <StatCard
            titre="Participation scrutins"
            valeur={depute.participationScrutins}
            moyenne={activite?.moyennesAssemblee.participationScrutins}
            unite="%"
          />
          <StatCard
            titre="Interventions"
            valeur={depute.interventions}
            moyenne={activite?.moyennesAssemblee.interventions}
          />
        </div>

        {/* Autres statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{depute.questionsEcrites || 0}</div>
            <div className="text-sm text-gray-500">Questions écrites</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{depute.questionsOrales || 0}</div>
            <div className="text-sm text-gray-500">Questions orales</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{depute.propositionsLoi || 0}</div>
            <div className="text-sm text-gray-500">Propositions de loi</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{depute.rapports || 0}</div>
            <div className="text-sm text-gray-500">Rapports</div>
          </div>
        </div>

        {/* Votes et statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Derniers votes
            </h2>
            {votes.length > 0 ? (
              <div className="space-y-3">
                {votes.slice(0, 5).map((vote) => (
                  <VoteCard key={vote.id} vote={vote} />
                ))}
                {votes.length > 5 && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Et {votes.length - 5} autres votes...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Aucun vote enregistré pour le moment.
              </p>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Statistiques de vote
            </h2>
            {statsVotes && statsVotes.total > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{statsVotes.pour || 0}</div>
                    <div className="text-sm text-gray-500">Pour</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{statsVotes.contre || 0}</div>
                    <div className="text-sm text-gray-500">Contre</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{statsVotes.abstention || 0}</div>
                    <div className="text-sm text-gray-500">Abstention</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">{statsVotes.nonVotant || 0}</div>
                    <div className="text-sm text-gray-500">Non votant</div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500 pt-2 border-t dark:border-gray-700">
                  Total : {statsVotes.total} scrutins
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Aucune statistique de vote disponible.
              </p>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sources : Assemblée nationale, NosDéputés.fr
        </div>
      </div>
    </>
  );
}

// Composant pour afficher un vote
function VoteCard({ vote }: { vote: VoteDepute }) {
  const positionConfig: Record<PositionVote, { icon: React.ElementType; color: string; label: string }> = {
    POUR: { icon: CheckIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', label: 'Pour' },
    CONTRE: { icon: XMarkIcon, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Contre' },
    ABSTENTION: { icon: MinusIcon, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800', label: 'Abstention' },
    NON_VOTANT: { icon: NoSymbolIcon, color: 'text-gray-400 bg-gray-50 dark:bg-gray-800', label: 'Non votant' },
  };

  const config = positionConfig[vote.position];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className={`p-2 rounded-full ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {vote.scrutin?.titre || 'Vote sans titre'}
        </p>
        <p className="text-xs text-gray-500">
          {vote.scrutin?.dateScrutin ? new Date(vote.scrutin.dateScrutin).toLocaleDateString('fr-FR') : 'Date inconnue'}
          {vote.scrutin?.resultat && (
            <span className={`ml-2 ${vote.scrutin.resultat === 'ADOPTE' ? 'text-green-600' : 'text-red-600'}`}>
              {vote.scrutin.resultat === 'ADOPTE' ? 'Adopté' : 'Rejeté'}
            </span>
          )}
        </p>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

// Composant pour les cartes de statistiques
function StatCard({
  titre,
  valeur,
  moyenne,
  unite = '',
}: {
  titre: string;
  valeur?: number | null;
  moyenne?: number | null;
  unite?: string;
}) {
  const valeurAffichee = valeur !== null && valeur !== undefined ? valeur.toFixed(1) : '-';
  const comparaison = valeur !== null && valeur !== undefined && moyenne !== null && moyenne !== undefined
    ? valeur - moyenne
    : null;

  return (
    <div className="card p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{titre}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {valeurAffichee}{valeur !== null && valeur !== undefined ? unite : ''}
      </div>
      {comparaison !== null && (
        <div className={`text-xs mt-1 ${comparaison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {comparaison >= 0 ? '+' : ''}{comparaison.toFixed(1)}{unite} vs moyenne
        </div>
      )}
    </div>
  );
}
