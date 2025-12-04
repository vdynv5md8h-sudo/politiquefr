import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { senateursApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Senateur } from '@/types';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

export default function SenateurDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['senateur', id],
    queryFn: () => senateursApi.detail(id!),
    enabled: !!id,
  });

  const { data: activiteData } = useQuery({
    queryKey: ['senateur-activite', id],
    queryFn: () => senateursApi.activite(id!),
    enabled: !!id,
  });

  const senateur = data?.donnees as Senateur | undefined;
  const activite = activiteData?.donnees as {
    senateur: Senateur;
    moyennesSenat: Record<string, number | null>;
  } | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Chargement taille="lg" texte="Chargement du profil..." />
      </div>
    );
  }

  if (error || !senateur) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Sénateur non trouvé
        </h1>
        <Link to="/senateurs" className="link">
          Retour à la liste des sénateurs
        </Link>
      </div>
    );
  }

  // Determine renewal year based on series
  const anneeRenouvellement = senateur.serieSenat === 1 ? 2023 : 2026;

  return (
    <>
      <Helmet>
        <title>{senateur.prenom} {senateur.nom} - Sénateur - PolitiqueFR</title>
        <meta
          name="description"
          content={`Profil de ${senateur.civilite} ${senateur.prenom} ${senateur.nom}, sénateur${senateur.civilite === 'Mme' ? 'rice' : ''} de ${senateur.departement}. Série ${senateur.serieSenat}, renouvellement ${anneeRenouvellement}.`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lien retour */}
        <Link to="/senateurs" className="link mb-4 inline-block">
          ← Retour à la liste des sénateurs
        </Link>

        {/* En-tête du profil */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {senateur.photoUrl ? (
                <img
                  src={senateur.photoUrl}
                  alt={`${senateur.prenom} ${senateur.nom}`}
                  className="w-32 h-32 rounded-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">
                    {senateur.prenom[0]}{senateur.nom[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {senateur.civilite} {senateur.prenom} {senateur.nom}
                </h1>
                {senateur.groupe && (
                  <Link
                    to={`/groupes/${senateur.groupe.id}`}
                    className="badge text-sm"
                    style={{
                      backgroundColor: senateur.groupe.couleur ? `${senateur.groupe.couleur}20` : '#e5e7eb',
                      color: senateur.groupe.couleur || '#374151',
                    }}
                  >
                    {senateur.groupe.acronyme}
                  </Link>
                )}
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                Sénateur{senateur.civilite === 'Mme' ? 'rice' : ''} de {senateur.departement} ({senateur.codeDepartement})
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Série {senateur.serieSenat} - Renouvellement {anneeRenouvellement}
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Début du mandat :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(senateur.dateDebutMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {senateur.typeElection && (
                  <div>
                    <span className="text-gray-500">Type :</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {senateur.typeElection}
                    </span>
                  </div>
                )}
                {senateur.profession && (
                  <div>
                    <span className="text-gray-500">Profession :</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {senateur.profession}
                    </span>
                  </div>
                )}
              </div>

              {/* Liens */}
              <div className="flex flex-wrap gap-3 mt-4">
                {senateur.email && (
                  <a
                    href={`mailto:${senateur.email}`}
                    className="btn-outline text-sm"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    Email
                  </a>
                )}
                {senateur.siteWeb && (
                  <a
                    href={senateur.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Site web
                  </a>
                )}
                {senateur.urlSenat && (
                  <a
                    href={senateur.urlSenat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                    Sénat.fr
                  </a>
                )}
                {senateur.twitter && (
                  <a
                    href={`https://twitter.com/${senateur.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    @{senateur.twitter}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques d'activité */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            titre="Présence en commission"
            valeur={senateur.presenceCommission}
            moyenne={activite?.moyennesSenat.presenceCommission}
            unite="%"
          />
          <StatCard
            titre="Présence en séance"
            valeur={senateur.presenceSeance}
            moyenne={activite?.moyennesSenat.presenceSeance}
            unite="%"
          />
          <StatCard
            titre="Questions écrites"
            valeur={senateur.questionsEcrites}
            moyenne={activite?.moyennesSenat.questionsEcrites}
          />
          <StatCard
            titre="Questions orales"
            valeur={senateur.questionsOrales}
            moyenne={activite?.moyennesSenat.questionsOrales}
          />
        </div>

        {/* Autres statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{senateur.propositionsLoi || 0}</div>
            <div className="text-sm text-gray-500">Propositions de loi</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{senateur.rapports || 0}</div>
            <div className="text-sm text-gray-500">Rapports</div>
          </div>
        </div>

        {/* Placeholder pour les votes et informations complémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Derniers votes
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Les votes seront affichés prochainement.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Informations complémentaires
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Matricule Sénat</span>
                <span className="font-medium text-gray-900 dark:text-white">{senateur.matricule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Département</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {senateur.departement} ({senateur.codeDepartement})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Série</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Série {senateur.serieSenat} (renouv. {anneeRenouvellement})
                </span>
              </div>
              {senateur.groupe && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Groupe politique</span>
                  <Link
                    to={`/groupes/${senateur.groupe.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {senateur.groupe.nom}
                  </Link>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Mandat en cours</span>
                <span className={`font-medium ${senateur.mandatEnCours ? 'text-green-600' : 'text-red-600'}`}>
                  {senateur.mandatEnCours ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sources : Sénat (senat.fr)
        </div>
      </div>
    </>
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
