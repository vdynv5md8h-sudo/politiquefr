import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { deputesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Depute } from '@/types';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
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

  const depute = data?.donnees as Depute | undefined;
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

        {/* Placeholder pour les votes et promesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Derniers votes
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Les votes seront affichés après synchronisation des données.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Promesses électorales
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Les promesses seront ajoutées prochainement.
            </p>
          </div>
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
