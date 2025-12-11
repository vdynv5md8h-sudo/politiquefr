import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { travauxApi } from '../../services/api';
import Chargement from '../../components/common/Chargement';
import VotingResults from '../../components/travaux/VotingResults';
import type { TravauxParlementaire, TypeDocumentParlement, StatutExamenTravaux, ResumeLLM, Loi } from '../../types';
import {
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

// Labels et couleurs pour les types de documents
const TYPE_LABELS: Record<TypeDocumentParlement, string> = {
  PROJET_LOI: 'Projet de loi',
  PROPOSITION_LOI: 'Proposition de loi',
  PROJET_LOI_ORGANIQUE: 'Projet de loi organique',
  PROPOSITION_LOI_ORGANIQUE: 'Proposition de loi organique',
  PROJET_LOI_FINANCES: 'Projet de loi de finances',
  PROJET_LOI_REGLEMENT: 'Projet de loi de règlement',
  PROJET_LOI_FINANCEMENT_SECU: 'PLFSS',
  PROPOSITION_RESOLUTION: 'Proposition de résolution',
  TEXTE_ADOPTE: 'Texte adopté',
  RAPPORT: 'Rapport',
  RAPPORT_INFORMATION: "Rapport d'information",
  AVIS: 'Avis',
};

const TYPE_COLORS: Record<TypeDocumentParlement, string> = {
  PROJET_LOI: 'bg-blue-100 text-blue-800',
  PROPOSITION_LOI: 'bg-green-100 text-green-800',
  PROJET_LOI_ORGANIQUE: 'bg-purple-100 text-purple-800',
  PROPOSITION_LOI_ORGANIQUE: 'bg-purple-100 text-purple-800',
  PROJET_LOI_FINANCES: 'bg-amber-100 text-amber-800',
  PROJET_LOI_REGLEMENT: 'bg-amber-100 text-amber-800',
  PROJET_LOI_FINANCEMENT_SECU: 'bg-red-100 text-red-800',
  PROPOSITION_RESOLUTION: 'bg-teal-100 text-teal-800',
  TEXTE_ADOPTE: 'bg-emerald-100 text-emerald-800',
  RAPPORT: 'bg-slate-100 text-slate-800',
  RAPPORT_INFORMATION: 'bg-slate-100 text-slate-800',
  AVIS: 'bg-gray-100 text-gray-800',
};

const STATUT_LABELS: Record<StatutExamenTravaux, string> = {
  EN_ATTENTE: 'En attente',
  EN_COMMISSION: 'En commission',
  EN_SEANCE: 'En séance',
  PREMIERE_LECTURE_AN: '1ère lecture AN',
  PREMIERE_LECTURE_SENAT: '1ère lecture Sénat',
  DEUXIEME_LECTURE: '2ème lecture',
  CMP: 'Commission mixte paritaire',
  LECTURE_DEFINITIVE: 'Lecture définitive',
  ADOPTE: 'Adopté',
  PROMULGUE: 'Promulgué',
  REJETE: 'Rejeté',
  RETIRE: 'Retiré',
  CADUQUE: 'Caduque',
};

const STATUT_COLORS: Record<StatutExamenTravaux, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-600',
  EN_COMMISSION: 'bg-yellow-100 text-yellow-700',
  EN_SEANCE: 'bg-orange-100 text-orange-700',
  PREMIERE_LECTURE_AN: 'bg-blue-100 text-blue-700',
  PREMIERE_LECTURE_SENAT: 'bg-indigo-100 text-indigo-700',
  DEUXIEME_LECTURE: 'bg-purple-100 text-purple-700',
  CMP: 'bg-pink-100 text-pink-700',
  LECTURE_DEFINITIVE: 'bg-violet-100 text-violet-700',
  ADOPTE: 'bg-green-100 text-green-700',
  PROMULGUE: 'bg-emerald-100 text-emerald-800',
  REJETE: 'bg-red-100 text-red-700',
  RETIRE: 'bg-gray-200 text-gray-600',
  CADUQUE: 'bg-gray-200 text-gray-500',
};

interface TravauxDetail extends TravauxParlementaire {
  resumes?: ResumeLLM[];
  loi?: Loi;
}

interface TimelineItem {
  etape: string;
  date: string | null;
  statut: string;
}

export default function TravauxDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Récupérer les détails du travail parlementaire
  const { data: travauxData, isLoading, error } = useQuery({
    queryKey: ['travaux', id],
    queryFn: () => travauxApi.detail(id!),
    enabled: !!id,
  });

  // Récupérer la timeline
  const { data: timelineData } = useQuery({
    queryKey: ['travaux', id, 'timeline'],
    queryFn: () => travauxApi.timeline(id!),
    enabled: !!id,
  });

  const travaux = travauxData?.donnees as TravauxDetail | undefined;
  const timeline = timelineData?.donnees?.timeline as TimelineItem[] | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Chargement taille="lg" texte="Chargement..." />
      </div>
    );
  }

  if (error || !travaux) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Travail parlementaire non trouvé
        </h1>
        <Link to="/travaux-parlementaires" className="text-blue-600 hover:underline">
          Retour à la liste des travaux parlementaires
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Trouver le résumé moyen ou court
  const resume = travaux.resumes?.find(r => r.typeResume === 'MOYEN') ||
                 travaux.resumes?.find(r => r.typeResume === 'COURT');

  return (
    <>
      <Helmet>
        <title>{travaux.titreCourt || travaux.titre} - PolitiqueFR</title>
        <meta
          name="description"
          content={resume?.contenu || `${TYPE_LABELS[travaux.typeDocument]} - ${travaux.titre}`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lien retour */}
        <Link to="/travaux-parlementaires" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Retour aux travaux parlementaires
        </Link>

        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${TYPE_COLORS[travaux.typeDocument]}`}>
                {TYPE_LABELS[travaux.typeDocument]}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUT_COLORS[travaux.statutExamen]}`}>
                {STATUT_LABELS[travaux.statutExamen]}
              </span>
              {travaux.theme && (
                <span
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: travaux.theme.couleur ? `${travaux.theme.couleur}20` : '#f3f4f6',
                    color: travaux.theme.couleur || '#6b7280',
                  }}
                >
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  {travaux.theme.nom}
                </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {travaux.titre}
            </h1>

            {/* Titre court */}
            {travaux.titreCourt && travaux.titreCourt !== travaux.titre && (
              <p className="text-lg text-gray-600 italic">
                « {travaux.titreCourt} »
              </p>
            )}

            {/* Informations principales */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                <span className="text-gray-500">Déposé le :</span>
                <span className="font-medium text-gray-900 ml-1">
                  {formatDate(travaux.dateDepot)}
                </span>
              </div>
              <div className="flex items-center">
                <BuildingLibraryIcon className="h-4 w-4 mr-1 text-gray-400" />
                <span className="text-gray-500">Chambre :</span>
                <span className="font-medium text-gray-900 ml-1">
                  {travaux.chambreOrigine === 'ASSEMBLEE' ? 'Assemblée nationale' : 'Sénat'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {travaux.legislature}e législature
                </span>
              </div>
            </div>

            {/* Liens externes */}
            <div className="flex flex-wrap gap-3 mt-2">
              {travaux.urlDossierAN && (
                <a
                  href={travaux.urlDossierAN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Dossier Assemblée nationale
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                </a>
              )}
              {travaux.urlDocumentPdf && (
                <a
                  href={travaux.urlDocumentPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Document PDF
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Résumé */}
            {resume && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Résumé
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {resume.contenu}
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Généré par {resume.modeleLLM}
                </p>
              </div>
            )}

            {/* Exposé sommaire */}
            {travaux.exposeSommaire && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Exposé sommaire
                </h2>
                <p className="text-gray-700 whitespace-pre-line text-sm">
                  {travaux.exposeSommaire.length > 2000
                    ? `${travaux.exposeSommaire.slice(0, 2000)}...`
                    : travaux.exposeSommaire}
                </p>
              </div>
            )}

            {/* Timeline / Parcours législatif */}
            {timeline && timeline.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Parcours législatif
                </h2>
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-6">
                    {timeline.map((item, index) => (
                      <div key={index} className="relative flex items-start gap-4">
                        {/* Point sur la timeline */}
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                            item.statut === 'completed'
                              ? 'bg-green-500'
                              : item.statut === 'current'
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <ClockIcon className="h-4 w-4 text-white" />
                        </div>

                        {/* Contenu */}
                        <div className="flex-grow pb-2">
                          <span className="font-medium text-gray-900">
                            {item.etape}
                          </span>
                          {item.date && (
                            <div className="text-sm text-gray-500">
                              {formatDate(item.date)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Résultats des votes */}
            {travaux.loi?.scrutins && travaux.loi.scrutins.length > 0 && (
              <VotingResults scrutins={travaux.loi.scrutins} />
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Informations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Informations
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">
                    {TYPE_LABELS[travaux.typeDocument]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className="font-medium text-gray-900">
                    {STATUT_LABELS[travaux.statutExamen]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chambre d'origine</span>
                  <span className="font-medium text-gray-900">
                    {travaux.chambreOrigine === 'ASSEMBLEE' ? 'AN' : 'Sénat'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Législature</span>
                  <span className="font-medium text-gray-900">
                    {travaux.legislature}e
                  </span>
                </div>
                {travaux.uid && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Référence</span>
                    <span className="font-medium text-gray-900 font-mono text-xs">
                      {travaux.uid}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Dates clés
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dépôt</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(travaux.dateDepot)}
                  </span>
                </div>
                {travaux.dateExamen && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Examen</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(travaux.dateExamen)}
                    </span>
                  </div>
                )}
                {travaux.dateAdoption && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Adoption</span>
                    <span className="font-medium text-green-600">
                      {formatDate(travaux.dateAdoption)}
                    </span>
                  </div>
                )}
                {travaux.datePromulgation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Promulgation</span>
                    <span className="font-medium text-purple-600">
                      {formatDate(travaux.datePromulgation)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Commission */}
            {travaux.commission && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Commission
                </h2>
                <p className="text-sm text-gray-700">
                  {travaux.commission.nomCourt || travaux.commission.nom}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Source : Assemblée nationale (data.assemblee-nationale.fr)
        </div>
      </div>
    </>
  );
}
