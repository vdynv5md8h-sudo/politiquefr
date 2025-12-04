import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { loisApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Loi, Scrutin, TypeLoi, StatutLoi } from '@/types';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

interface LoiDetail extends Loi {
  scrutins?: Scrutin[];
  _count?: {
    amendements: number;
  };
}

interface TimelineEvent {
  date: string;
  type: 'depot' | 'scrutin' | 'adoption' | 'promulgation';
  titre: string;
  resultat?: string;
  chambre?: string;
}

interface TimelineResponse {
  loi: { id: string; titre: string; statut: string };
  evenements: TimelineEvent[];
}

// Traductions et labels
const TYPE_LOI_LABELS: Record<TypeLoi, string> = {
  PROJET_LOI: 'Projet de loi',
  PROPOSITION_LOI: 'Proposition de loi',
  PROJET_LOI_ORGANIQUE: 'Projet de loi organique',
  PROPOSITION_LOI_ORGANIQUE: 'Proposition de loi organique',
  PROJET_LOI_FINANCES: 'Projet de loi de finances',
  PROJET_LOI_REGLEMENT: 'Projet de loi de règlement',
  PROJET_LOI_FINANCEMENT_SECU: 'PLFSS',
  PROPOSITION_RESOLUTION: 'Proposition de résolution',
};

const STATUT_LOI_LABELS: Record<StatutLoi, string> = {
  DEPOSE: 'Déposé',
  EN_COMMISSION: 'En commission',
  EN_SEANCE: 'En séance',
  ADOPTE_PREMIERE_LECTURE: 'Adopté en 1ère lecture',
  NAVETTE: 'En navette',
  ADOPTE_DEFINITIF: 'Adopté définitivement',
  PROMULGUE: 'Promulgué',
  REJETE: 'Rejeté',
  RETIRE: 'Retiré',
  CADUQUE: 'Caduque',
};

const STATUT_LOI_COLORS: Record<StatutLoi, string> = {
  DEPOSE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  EN_COMMISSION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  EN_SEANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ADOPTE_PREMIERE_LECTURE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  NAVETTE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  ADOPTE_DEFINITIF: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  PROMULGUE: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200',
  REJETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  RETIRE: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  CADUQUE: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400',
};

function getTimelineIcon(type: string) {
  switch (type) {
    case 'depot':
      return DocumentTextIcon;
    case 'scrutin':
      return ChartBarIcon;
    case 'adoption':
      return CheckCircleIcon;
    case 'promulgation':
      return ScaleIcon;
    default:
      return ClockIcon;
  }
}

function getTimelineColor(type: string, resultat?: string) {
  if (type === 'scrutin') {
    return resultat === 'ADOPTE' ? 'bg-green-500' : 'bg-red-500';
  }
  switch (type) {
    case 'depot':
      return 'bg-blue-500';
    case 'adoption':
      return 'bg-green-600';
    case 'promulgation':
      return 'bg-purple-600';
    default:
      return 'bg-gray-500';
  }
}

export default function LoiDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Récupérer les détails de la loi
  const { data: loiData, isLoading: isLoadingLoi, error: errorLoi } = useQuery({
    queryKey: ['loi', id],
    queryFn: () => loisApi.detail(id!),
    enabled: !!id,
  });

  // Récupérer la timeline de la loi
  const { data: timelineData } = useQuery({
    queryKey: ['loi', id, 'timeline'],
    queryFn: () => loisApi.timeline(id!),
    enabled: !!id,
  });

  const loi = loiData?.donnees as LoiDetail | undefined;
  const timeline = timelineData?.donnees as TimelineResponse | undefined;

  if (isLoadingLoi) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Chargement taille="lg" texte="Chargement de la loi..." />
      </div>
    );
  }

  if (errorLoi || !loi) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Texte législatif non trouvé
        </h1>
        <Link to="/lois" className="link">
          Retour à la liste des lois
        </Link>
      </div>
    );
  }

  // Parser les auteurs et rapporteurs (JSON)
  let auteurs: string[] = [];
  let rapporteurs: string[] = [];
  try {
    if (loi.auteurs) auteurs = JSON.parse(loi.auteurs);
    if (loi.rapporteurs) rapporteurs = JSON.parse(loi.rapporteurs);
  } catch {
    // Fallback si pas JSON
    if (loi.auteurs) auteurs = [loi.auteurs];
    if (loi.rapporteurs) rapporteurs = [loi.rapporteurs];
  }

  // Calculer les stats des scrutins
  const scrutinsAdoptes = loi.scrutins?.filter(s => s.resultat === 'ADOPTE').length || 0;
  const scrutinsRejetes = loi.scrutins?.filter(s => s.resultat === 'REJETE').length || 0;

  return (
    <>
      <Helmet>
        <title>{loi.titreCourt || loi.titre} - PolitiqueFR</title>
        <meta
          name="description"
          content={loi.resume || `${TYPE_LOI_LABELS[loi.type]} - ${STATUT_LOI_LABELS[loi.statut]}. ${loi.titre}`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Legislation',
            name: loi.titre,
            alternateName: loi.titreCourt || undefined,
            description: loi.resume || undefined,
            legislationType: TYPE_LOI_LABELS[loi.type],
            datePublished: loi.dateDepot,
            dateEnacted: loi.datePromulgation || undefined,
            legislationIdentifier: loi.numeroJo || loi.dossierId,
            url: loi.urlDossier || undefined,
          })}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lien retour */}
        <Link to="/lois" className="link mb-4 inline-block">
          ← Retour aux textes législatifs
        </Link>

        {/* En-tête de la loi */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Type et statut */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {TYPE_LOI_LABELS[loi.type]}
              </span>
              <span className={`badge ${STATUT_LOI_COLORS[loi.statut]}`}>
                {STATUT_LOI_LABELS[loi.statut]}
              </span>
              {loi.theme && (
                <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <TagIcon className="h-3 w-3 mr-1" />
                  {loi.theme.nom}
                </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {loi.titre}
            </h1>

            {/* Titre court */}
            {loi.titreCourt && loi.titreCourt !== loi.titre && (
              <p className="text-lg text-gray-600 dark:text-gray-400 italic">
                « {loi.titreCourt} »
              </p>
            )}

            {/* Dates clés */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                <span className="text-gray-500">Déposé le :</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {new Date(loi.dateDepot).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {loi.dateAdoption && (
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-gray-500">Adopté le :</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {new Date(loi.dateAdoption).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {loi.datePromulgation && (
                <div className="flex items-center">
                  <ScaleIcon className="h-4 w-4 mr-1 text-purple-500" />
                  <span className="text-gray-500">Promulgué le :</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {new Date(loi.datePromulgation).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Liens externes */}
            <div className="flex flex-wrap gap-3 mt-2">
              {loi.urlDossier && (
                <a
                  href={loi.urlDossier}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  Dossier législatif
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                </a>
              )}
              {loi.urlTexte && (
                <a
                  href={loi.urlTexte}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                  Texte intégral
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {loi.scrutins?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Scrutin{(loi.scrutins?.length || 0) > 1 ? 's' : ''}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{scrutinsAdoptes}</div>
            <div className="text-sm text-gray-500">Adopté{scrutinsAdoptes > 1 ? 's' : ''}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{scrutinsRejetes}</div>
            <div className="text-sm text-gray-500">Rejeté{scrutinsRejetes > 1 ? 's' : ''}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {loi._count?.amendements || 0}
            </div>
            <div className="text-sm text-gray-500">Amendement{(loi._count?.amendements || 0) > 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Résumé */}
            {loi.resume && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Résumé
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {loi.resume}
                </p>
              </div>
            )}

            {/* Exposé des motifs */}
            {loi.exposeDesMotifs && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Exposé des motifs
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm">
                  {loi.exposeDesMotifs.length > 1500
                    ? `${loi.exposeDesMotifs.slice(0, 1500)}...`
                    : loi.exposeDesMotifs}
                </p>
                {loi.exposeDesMotifs.length > 1500 && loi.urlDossier && (
                  <a
                    href={loi.urlDossier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link text-sm mt-4 inline-block"
                  >
                    Lire la suite sur le dossier législatif →
                  </a>
                )}
              </div>
            )}

            {/* Timeline */}
            {timeline && timeline.evenements.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Parcours législatif
                </h2>
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  <div className="space-y-6">
                    {timeline.evenements.map((event, index) => {
                      const Icon = getTimelineIcon(event.type);
                      return (
                        <div key={index} className="relative flex items-start gap-4">
                          {/* Point sur la timeline */}
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${getTimelineColor(event.type, event.resultat)}`}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>

                          {/* Contenu */}
                          <div className="flex-grow pb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {event.titre}
                              </span>
                              {event.resultat && (
                                <span
                                  className={`badge text-xs ${
                                    event.resultat === 'ADOPTE'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                  }`}
                                >
                                  {event.resultat === 'ADOPTE' ? 'Adopté' : 'Rejeté'}
                                </span>
                              )}
                              {event.chambre && (
                                <span className="text-xs text-gray-500">
                                  ({event.chambre === 'ASSEMBLEE' ? 'AN' : 'Sénat'})
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Scrutins détaillés */}
            {loi.scrutins && loi.scrutins.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Scrutins ({loi.scrutins.length})
                </h2>
                <div className="space-y-4">
                  {loi.scrutins.map((scrutin) => (
                    <div
                      key={scrutin.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {scrutin.titre}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {scrutin.chambre === 'ASSEMBLEE' ? 'Assemblée nationale' : 'Sénat'} ·{' '}
                            {new Date(scrutin.dateScrutin).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span
                          className={`badge ${
                            scrutin.resultat === 'ADOPTE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {scrutin.resultat === 'ADOPTE' ? (
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 mr-1" />
                          )}
                          {scrutin.resultat === 'ADOPTE' ? 'Adopté' : 'Rejeté'}
                        </span>
                      </div>

                      {/* Barres de résultat */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <span className="w-16 text-gray-500">Pour</span>
                          <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div
                              className="bg-green-500 h-4 rounded-full"
                              style={{
                                width: `${(scrutin.pour / scrutin.nombreVotants) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-medium">{scrutin.pour}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <span className="w-16 text-gray-500">Contre</span>
                          <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div
                              className="bg-red-500 h-4 rounded-full"
                              style={{
                                width: `${(scrutin.contre / scrutin.nombreVotants) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-medium">{scrutin.contre}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-16 text-gray-500">Abstention</span>
                          <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div
                              className="bg-gray-400 h-4 rounded-full"
                              style={{
                                width: `${(scrutin.abstention / scrutin.nombreVotants) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-medium">{scrutin.abstention}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        {scrutin.nombreVotants} votants · Majorité absolue : {scrutin.majoriteAbsolue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Informations */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Informations
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                    {TYPE_LOI_LABELS[loi.type]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {STATUT_LOI_LABELS[loi.statut]}
                  </span>
                </div>
                {loi.dossierId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">N° dossier</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono text-xs">
                      {loi.dossierId}
                    </span>
                  </div>
                )}
                {loi.numeroJo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">N° J.O.</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {loi.numeroJo}
                    </span>
                  </div>
                )}
                {loi.theme && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Thème</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {loi.theme.nom}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Auteurs */}
            {auteurs.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Auteur{auteurs.length > 1 ? 's' : ''}
                </h2>
                <ul className="space-y-2">
                  {auteurs.map((auteur, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {auteur}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rapporteurs */}
            {rapporteurs.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Rapporteur{rapporteurs.length > 1 ? 's' : ''}
                </h2>
                <ul className="space-y-2">
                  {rapporteurs.map((rapporteur, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {rapporteur}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dates importantes */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Dates clés
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dépôt</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(loi.dateDepot).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {loi.dateAdoption && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Adoption</span>
                    <span className="font-medium text-green-600">
                      {new Date(loi.dateAdoption).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {loi.datePromulgation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Promulgation</span>
                    <span className="font-medium text-purple-600">
                      {new Date(loi.datePromulgation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sources : Assemblée nationale, Sénat, Légifrance
        </div>
      </div>
    </>
  );
}
