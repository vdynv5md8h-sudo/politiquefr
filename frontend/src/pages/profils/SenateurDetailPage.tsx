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
  UserIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingLibraryIcon,
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

  return (
    <>
      <Helmet>
        <title>{senateur.prenom} {senateur.nom} - Sénateur{senateur.civilite === 'Mme' ? 'rice' : ''} - PolitiqueFR</title>
        <meta
          name="description"
          content={`Profil de ${senateur.civilite} ${senateur.prenom} ${senateur.nom}, sénateur${senateur.civilite === 'Mme' ? 'rice' : ''} de ${senateur.departement}. Série ${senateur.serieSenat}, renouvellement ${anneeRenouvellement}.`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: `${senateur.prenom} ${senateur.nom}`,
            jobTitle: `Sénateur${senateur.civilite === 'Mme' ? 'rice' : ''} de ${senateur.departement}`,
            worksFor: {
              '@type': 'Organization',
              name: 'Sénat',
              url: 'https://www.senat.fr',
            },
            memberOf: senateur.groupe ? {
              '@type': 'Organization',
              name: senateur.groupe.nom,
            } : undefined,
            image: senateur.photoUrl || undefined,
            email: senateur.email || undefined,
            url: senateur.siteWeb || senateur.urlSenat || undefined,
            birthDate: senateur.dateNaissance || undefined,
            birthPlace: senateur.lieuNaissance || undefined,
          })}
        </script>
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
                <div className="w-32 h-32 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-300">
                    {senateur.prenom[0]}{senateur.nom[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Informations principales */}
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
                {!senateur.mandatEnCours && (
                  <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm">
                    Mandat terminé
                  </span>
                )}
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                <BuildingLibraryIcon className="h-5 w-5 inline mr-1" />
                Sénateur{senateur.civilite === 'Mme' ? 'rice' : ''} de <strong>{senateur.departement}</strong> ({senateur.codeDepartement})
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Série {senateur.serieSenat} - Renouvellement {anneeRenouvellement}
              </p>

              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-gray-500">Mandat depuis :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {new Date(senateur.dateDebutMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {senateur.typeElection && (
                  <div className="flex items-center">
                    <span className="text-gray-500">Type :</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white ml-1">
                      {senateur.typeElection}
                    </span>
                  </div>
                )}
              </div>

              {/* Liens de contact */}
              <div className="flex flex-wrap gap-3">
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Activité parlementaire
        </h2>
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
                <span className="font-medium text-gray-900 dark:text-white">{senateur.civilite}</span>
              </div>
              {senateur.dateNaissance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de naissance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(senateur.dateNaissance).toLocaleDateString('fr-FR')} ({calculateAge(senateur.dateNaissance)} ans)
                  </span>
                </div>
              )}
              {senateur.lieuNaissance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Lieu de naissance</span>
                  <span className="font-medium text-gray-900 dark:text-white">{senateur.lieuNaissance}</span>
                </div>
              )}
              {senateur.profession && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Profession</span>
                  <span className="font-medium text-gray-900 dark:text-white">{senateur.profession}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Matricule</span>
                <span className="font-medium text-gray-900 dark:text-white">{senateur.matricule}</span>
              </div>
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
                <span className="text-gray-500">Département</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {senateur.departement} ({senateur.codeDepartement})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Série</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Série {senateur.serieSenat} (renouvellement {anneeRenouvellement})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Début du mandat</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(senateur.dateDebutMandat).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {senateur.dateFinMandat && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fin du mandat</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(senateur.dateFinMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {senateur.typeElection && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Type d'élection</span>
                  <span className="font-medium text-gray-900 dark:text-white">{senateur.typeElection}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className={`font-medium ${senateur.mandatEnCours ? 'text-green-600' : 'text-red-600'}`}>
                  {senateur.mandatEnCours ? 'En cours' : 'Terminé'}
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
            </div>
          </div>
        </div>

        {/* Votes et informations complémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

        {/* Contact complet */}
        {(senateur.email || senateur.siteWeb || senateur.twitter || senateur.urlSenat) && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {senateur.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={`mailto:${senateur.email}`} className="text-blue-600 hover:underline">
                    {senateur.email}
                  </a>
                </div>
              )}
              {senateur.siteWeb && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={senateur.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {senateur.siteWeb.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {senateur.twitter && (
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2 font-bold">X</span>
                  <a href={`https://twitter.com/${senateur.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    @{senateur.twitter}
                  </a>
                </div>
              )}
              {senateur.urlSenat && (
                <div className="flex items-center">
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={senateur.urlSenat} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Fiche sur senat.fr
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

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
