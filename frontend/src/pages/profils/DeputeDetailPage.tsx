import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { deputesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Depute, VoteDepute, PositionVote, Question } from '@/types';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  XMarkIcon,
  MinusIcon,
  NoSymbolIcon,
  UserIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export default function DeputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionsFilter, setQuestionsFilter] = useState<'all' | 'QE' | 'QOSD'>('all');

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

  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['depute-questions', id, questionsFilter],
    queryFn: () => deputesApi.questions(id!, { type: questionsFilter === 'all' ? undefined : questionsFilter }),
    enabled: !!id && showQuestions,
  });

  const depute = data?.donnees as Depute | undefined;
  const votesResponse = votesData?.donnees as { votes: VoteDepute[]; statistiques: Record<string, number> } | undefined;
  const votes = votesResponse?.votes || [];
  const statsVotes = votesResponse?.statistiques;
  const activite = activiteData?.donnees as {
    depute: Depute;
    moyennesAssemblee: Record<string, number | null>;
  } | undefined;
  const questionsResponse = questionsData?.donnees as { questions: Question[]; statistiques: Record<string, number> } | undefined;
  const questions = questionsResponse?.questions || [];
  const statsQuestions = questionsResponse?.statistiques;

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

  // Calcul de l'âge
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // URL vers l'Assemblée nationale pour les statistiques détaillées
  const getStatUrl = (_statType: string): string => {
    // Utilise urlAssemblee si disponible, sinon construit l'URL
    if (depute.urlAssemblee) {
      return depute.urlAssemblee;
    }
    // Fallback vers la page générale du député
    return `https://www.assemblee-nationale.fr/dyn/deputes/${depute.id}`;
  };

  return (
    <>
      <Helmet>
        <title>{depute.prenom} {depute.nom} - Député{depute.civilite === 'Mme' ? 'e' : ''} - PolitiqueFR</title>
        <meta
          name="description"
          content={`Profil de ${depute.civilite} ${depute.prenom} ${depute.nom}, député${depute.civilite === 'Mme' ? 'e' : ''} de ${depute.departement}. Activité parlementaire, votes, et statistiques.`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: `${depute.prenom} ${depute.nom}`,
            jobTitle: `Député${depute.civilite === 'Mme' ? 'e' : ''} de ${depute.departement}`,
            worksFor: {
              '@type': 'Organization',
              name: 'Assemblée nationale',
              url: 'https://www.assemblee-nationale.fr',
            },
            memberOf: depute.groupe ? {
              '@type': 'Organization',
              name: depute.groupe.nom,
            } : undefined,
            image: depute.photoUrl || undefined,
            email: depute.email || undefined,
            url: depute.siteWeb || undefined,
            birthDate: depute.dateNaissance || undefined,
            birthPlace: depute.lieuNaissance || undefined,
          })}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lien retour */}
        <Link to="/deputes" className="link mb-4 inline-block">
          ← Retour à la liste des députés
        </Link>

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
                <div className="w-32 h-32 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                    {depute.prenom[0]}{depute.nom[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Informations principales */}
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
                {!depute.mandatEnCours && (
                  <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm">
                    Mandat terminé
                  </span>
                )}
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                <BuildingLibraryIcon className="h-5 w-5 inline mr-1" />
                Député{depute.civilite === 'Mme' ? 'e' : ''} de <strong>{depute.departement}</strong> ({depute.numeroCirconscription}<sup>e</sup> circonscription)
              </p>

              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-gray-500">Mandat depuis :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {new Date(depute.dateDebutMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500">Législature :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {depute.legislature}<sup>e</sup>
                  </span>
                </div>
              </div>

              {/* Liens de contact */}
              <div className="flex flex-wrap gap-3">
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
                {depute.twitter && (
                  <a
                    href={`https://twitter.com/${depute.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    @{depute.twitter}
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
                {depute.urlAssemblee && (
                  <a
                    href={depute.urlAssemblee}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                    Assemblée nationale
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques d'activité */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Activité parlementaire
        </h2>
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

        {/* Autres statistiques - questions cliquables pour afficher les détails */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => { setShowQuestions(true); setQuestionsFilter('QE'); }}
            className={`card p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group ${showQuestions && questionsFilter === 'QE' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="text-2xl font-bold text-blue-600">{depute.questionsEcrites || 0}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Questions écrites
              <ChevronDownIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          <button
            onClick={() => { setShowQuestions(true); setQuestionsFilter('QOSD'); }}
            className={`card p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group ${showQuestions && questionsFilter === 'QOSD' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl font-bold text-green-600">{depute.questionsOrales || 0}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Questions orales
              <ChevronDownIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          <a
            href={getStatUrl('propositionsLoi')}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="text-2xl font-bold text-purple-600">{depute.propositionsLoi || 0}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Propositions de loi
              <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
          <a
            href={getStatUrl('rapports')}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="text-2xl font-bold text-orange-600">{depute.rapports || 0}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Rapports
              <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
          <a
            href={getStatUrl('amendementsProposes')}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="text-2xl font-bold text-indigo-600">{depute.amendementsProposes || 0}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Amendements proposés
              <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
          <a
            href={getStatUrl('amendementsAdoptes')}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="text-2xl font-bold text-teal-600">{depute.amendementsAdoptes || 0}</div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Amendements adoptés
              <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        </div>

        {/* Section Questions parlementaires (collapsible) */}
        {showQuestions && (
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Questions parlementaires
                {statsQuestions && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({statsQuestions.total} au total)
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowQuestions(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronUpIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setQuestionsFilter('all')}
                className={`px-3 py-1 rounded-full text-sm ${questionsFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Toutes
              </button>
              <button
                onClick={() => setQuestionsFilter('QE')}
                className={`px-3 py-1 rounded-full text-sm ${questionsFilter === 'QE' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Écrites ({statsQuestions?.questionsEcrites || 0})
              </button>
              <button
                onClick={() => setQuestionsFilter('QOSD')}
                className={`px-3 py-1 rounded-full text-sm ${questionsFilter === 'QOSD' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Orales ({statsQuestions?.questionsOrales || 0})
              </button>
            </div>

            {/* Liste des questions */}
            {isLoadingQuestions ? (
              <div className="py-8 text-center">
                <Chargement taille="md" texte="Chargement des questions..." />
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Aucune question trouvée.
              </p>
            )}
          </div>
        )}

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Informations personnelles */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Informations personnelles
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Civilité</span>
                <span className="font-medium text-gray-900 dark:text-white">{depute.civilite}</span>
              </div>
              {depute.dateNaissance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de naissance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(depute.dateNaissance).toLocaleDateString('fr-FR')} ({calculateAge(depute.dateNaissance)} ans)
                  </span>
                </div>
              )}
              {depute.lieuNaissance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Lieu de naissance</span>
                  <span className="font-medium text-gray-900 dark:text-white">{depute.lieuNaissance}</span>
                </div>
              )}
              {depute.profession && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Profession</span>
                  <span className="font-medium text-gray-900 dark:text-white">{depute.profession}</span>
                </div>
              )}
              {depute.nomUsuel && depute.nomUsuel !== depute.nom && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom d'usage</span>
                  <span className="font-medium text-gray-900 dark:text-white">{depute.nomUsuel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mandat */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Mandat
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Circonscription</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {depute.numeroCirconscription}<sup>e</sup> de {depute.departement}
                </span>
              </div>
              {depute.codeDepartement && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Code département</span>
                  <span className="font-medium text-gray-900 dark:text-white">{depute.codeDepartement}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Législature</span>
                <span className="font-medium text-gray-900 dark:text-white">{depute.legislature}<sup>e</sup></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Début du mandat</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(depute.dateDebutMandat).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {depute.dateFinMandat && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fin du mandat</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(depute.dateFinMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {depute.motifFin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Motif de fin</span>
                  <span className="font-medium text-gray-900 dark:text-white">{depute.motifFin}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className={`font-medium ${depute.mandatEnCours ? 'text-green-600' : 'text-red-600'}`}>
                  {depute.mandatEnCours ? 'En cours' : 'Terminé'}
                </span>
              </div>
              {depute.groupe && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Groupe politique</span>
                  <Link
                    to={`/groupes/${depute.groupe.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {depute.groupe.nom}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Votes et statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

        {/* Contact complet */}
        {(depute.email || depute.siteWeb || depute.twitter || depute.facebook) && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {depute.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={`mailto:${depute.email}`} className="text-blue-600 hover:underline">
                    {depute.email}
                  </a>
                </div>
              )}
              {depute.siteWeb && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={depute.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {depute.siteWeb.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {depute.twitter && (
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2 font-bold">X</span>
                  <a href={`https://twitter.com/${depute.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    @{depute.twitter}
                  </a>
                </div>
              )}
              {depute.facebook && (
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2 font-bold">f</span>
                  <a href={`https://facebook.com/${depute.facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {depute.facebook}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

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

// Composant pour afficher une question parlementaire
function QuestionCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);

  const typeLabel = {
    QE: { label: 'Écrite', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    QOSD: { label: 'Orale', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    QG: { label: 'Au Gouvernement', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  };

  const config = typeLabel[question.type] || typeLabel.QE;

  // Truncate long text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Clean HTML from text
  const cleanHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const questionText = cleanHtml(question.texteQuestion);
  const responseText = question.texteReponse ? cleanHtml(question.texteReponse) : null;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.color}`}>
              {config.label}
            </span>
            {question.rubrique && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {question.rubrique}
              </span>
            )}
            {question.texteReponse && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                Répondue
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {expanded ? questionText : truncateText(questionText, 200)}
          </p>

          {expanded && responseText && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded border-l-4 border-green-500">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Réponse du {question.ministereDeveloppe || question.ministereAcronyme || 'Ministère'}
                {question.dateReponse && ` - ${new Date(question.dateReponse).toLocaleDateString('fr-FR')}`}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {truncateText(responseText, 500)}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {new Date(question.dateQuestion).toLocaleDateString('fr-FR')}
              {question.ministereAcronyme && ` • ${question.ministereAcronyme}`}
            </p>

            {(questionText.length > 200 || responseText) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {expanded ? 'Voir moins' : 'Voir plus'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
