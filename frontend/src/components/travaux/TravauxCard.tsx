import { Link } from 'react-router-dom';
import { TravauxParlementaire, TypeDocumentParlement, StatutExamenTravaux, AuteurEnrichi } from '../../types';

interface TravauxCardProps {
  travaux: TravauxParlementaire;
}

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
  CMP: 'CMP',
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

export default function TravauxCard({ travaux }: TravauxCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const resumeCourt = travaux.resumes?.find(r => r.typeResume === 'COURT');

  // Parse author data - handles both old format (string[]) and new enriched format (AuteurEnrichi[])
  const auteurs: AuteurEnrichi[] = travaux.auteurs ? (() => {
    try {
      const parsed = JSON.parse(travaux.auteurs);
      if (Array.isArray(parsed)) {
        // Check if it's old format (array of strings) or new format (array of objects)
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          // Old format: convert string IDs to AuteurEnrichi objects
          return parsed.map((id: string) => ({ acteurRef: id }));
        }
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  })() : [];

  // Get primary author info (first one with a name, or first one if no names available)
  const auteurPrincipal = auteurs.find(a => a.nom && a.prenom) || (auteurs.length > 0 ? auteurs[0] : null);

  return (
    <Link
      to={`/travaux-parlementaires/${travaux.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
    >
      <div className="p-4">
        {/* Header avec badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[travaux.typeDocument]}`}>
            {TYPE_LABELS[travaux.typeDocument]}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUT_COLORS[travaux.statutExamen]}`}>
            {STATUT_LABELS[travaux.statutExamen]}
          </span>
          {travaux.theme && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: travaux.theme.couleur ? `${travaux.theme.couleur}20` : '#f3f4f6',
                color: travaux.theme.couleur || '#6b7280',
              }}
            >
              {travaux.theme.nom}
            </span>
          )}
        </div>

        {/* Titre */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {travaux.titre}
        </h3>

        {/* Auteur et groupe politique */}
        {auteurPrincipal && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span className="text-gray-600">
              {auteurPrincipal.nom && auteurPrincipal.prenom
                ? `${auteurPrincipal.prenom} ${auteurPrincipal.nom}`
                : auteurPrincipal.acteurRef
              }
            </span>
            {auteurPrincipal.groupeAcronyme && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: auteurPrincipal.groupeCouleur ? `${auteurPrincipal.groupeCouleur}20` : '#e5e7eb',
                  color: auteurPrincipal.groupeCouleur || '#4b5563',
                }}
              >
                {auteurPrincipal.groupeAcronyme}
              </span>
            )}
            {auteurs.length > 1 && (
              <span className="text-gray-400 text-xs">
                +{auteurs.length - 1} co-auteur{auteurs.length > 2 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Résumé court si disponible */}
        {resumeCourt && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {resumeCourt.contenu}
          </p>
        )}

        {/* Footer avec infos */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
          <span>Déposé le {formatDate(travaux.dateDepot)}</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {travaux.legislature}e législature
          </span>
        </div>
      </div>
    </Link>
  );
}
