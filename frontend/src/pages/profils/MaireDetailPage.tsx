import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { mairesApi } from '@/services/api';
import Chargement from '@/components/common/Chargement';
import type { Maire } from '@/types';
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function MaireDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['maire', id],
    queryFn: () => mairesApi.detail(id!),
    enabled: !!id,
  });

  const maire = data?.donnees as Maire | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Chargement taille="lg" texte="Chargement du profil..." />
      </div>
    );
  }

  if (error || !maire) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Maire non trouvé
        </h1>
        <Link to="/maires" className="link">
          Retour à la liste des maires
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

  return (
    <>
      <Helmet>
        <title>{maire.prenom} {maire.nom} - Maire de {maire.libelleCommune} - PolitiqueFR</title>
        <meta
          name="description"
          content={`Profil de ${maire.civilite} ${maire.prenom} ${maire.nom}, maire de ${maire.libelleCommune} (${maire.codeDepartement}). Informations de contact et mandat.`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: `${maire.prenom} ${maire.nom}`,
            jobTitle: `Maire de ${maire.libelleCommune}`,
            worksFor: {
              '@type': 'GovernmentOrganization',
              name: `Mairie de ${maire.libelleCommune}`,
              address: {
                '@type': 'PostalAddress',
                addressLocality: maire.libelleCommune,
                addressRegion: maire.libelleDepartement,
                addressCountry: 'FR',
              },
            },
            image: maire.photoUrl || undefined,
            email: maire.email || undefined,
            telephone: maire.telephone || undefined,
            url: maire.siteWeb || undefined,
            birthDate: maire.dateNaissance || undefined,
            birthPlace: maire.lieuNaissance || undefined,
          })}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lien retour */}
        <Link to="/maires" className="link mb-4 inline-block">
          ← Retour à la liste des maires
        </Link>

        {/* En-tête du profil */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Photo ou initiales */}
            <div className="flex-shrink-0">
              {maire.photoUrl ? (
                <img
                  src={maire.photoUrl}
                  alt={`${maire.prenom} ${maire.nom}`}
                  className="w-32 h-32 rounded-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-300">
                    {maire.prenom?.[0]}{maire.nom?.[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {maire.civilite} {maire.prenom} {maire.nom}
                </h1>
                {maire.libelleNuance && (
                  <span className="badge text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {maire.libelleNuance}
                  </span>
                )}
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                <BuildingOfficeIcon className="h-5 w-5 inline mr-1" />
                {maire.fonctionMandat || 'Maire'} de <strong>{maire.libelleCommune}</strong>
              </p>

              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-gray-500">Département :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {maire.libelleDepartement} ({maire.codeDepartement})
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-gray-500">Mandat depuis :</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white ml-1">
                    {new Date(maire.dateDebutMandat).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Liens de contact */}
              <div className="flex flex-wrap gap-3">
                {maire.email && (
                  <a
                    href={`mailto:${maire.email}`}
                    className="btn-outline text-sm"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    Email
                  </a>
                )}
                {maire.telephone && (
                  <a
                    href={`tel:${maire.telephone}`}
                    className="btn-outline text-sm"
                  >
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {maire.telephone}
                  </a>
                )}
                {maire.siteWeb && (
                  <a
                    href={maire.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Site web
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Commune */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Commune
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nom de la commune</span>
                <span className="font-medium text-gray-900 dark:text-white">{maire.libelleCommune}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Code commune</span>
                <span className="font-medium text-gray-900 dark:text-white">{maire.codeCommune}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Département</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {maire.libelleDepartement} ({maire.codeDepartement})
                </span>
              </div>
              {maire.libelleRegion && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Région</span>
                  <span className="font-medium text-gray-900 dark:text-white">{maire.libelleRegion}</span>
                </div>
              )}
              {maire.codeRegion && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Code région</span>
                  <span className="font-medium text-gray-900 dark:text-white">{maire.codeRegion}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Informations personnelles
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Civilité</span>
                <span className="font-medium text-gray-900 dark:text-white">{maire.civilite}</span>
              </div>
              {maire.dateNaissance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de naissance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(maire.dateNaissance).toLocaleDateString('fr-FR')} ({calculateAge(maire.dateNaissance)} ans)
                  </span>
                </div>
              )}
              {maire.lieuNaissance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Lieu de naissance</span>
                  <span className="font-medium text-gray-900 dark:text-white">{maire.lieuNaissance}</span>
                </div>
              )}
              {maire.profession && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Profession</span>
                  <span className="font-medium text-gray-900 dark:text-white">{maire.profession}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mandat */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            Mandat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{maire.fonctionMandat || 'Maire'}</div>
              <div className="text-sm text-gray-500">Fonction</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {new Date(maire.dateDebutMandat).toLocaleDateString('fr-FR')}
              </div>
              <div className="text-sm text-gray-500">Début du mandat</div>
            </div>
            {maire.libelleNuance ? (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{maire.libelleNuance}</div>
                <div className="text-sm text-gray-500">Nuance politique</div>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-gray-400">Non renseignée</div>
                <div className="text-sm text-gray-500">Nuance politique</div>
              </div>
            )}
          </div>
          {maire.dateFinMandat && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Fin du mandat : {new Date(maire.dateFinMandat).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Contact complet */}
        {(maire.email || maire.telephone || maire.siteWeb) && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {maire.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={`mailto:${maire.email}`} className="text-blue-600 hover:underline">
                    {maire.email}
                  </a>
                </div>
              )}
              {maire.telephone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={`tel:${maire.telephone}`} className="text-blue-600 hover:underline">
                    {maire.telephone}
                  </a>
                </div>
              )}
              {maire.siteWeb && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <a href={maire.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {maire.siteWeb.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nuance politique détail */}
        {(maire.codeNuance || maire.libelleNuance) && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Nuance politique
            </h2>
            <div className="space-y-3 text-sm">
              {maire.codeNuance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Code nuance</span>
                  <span className="font-medium text-gray-900 dark:text-white">{maire.codeNuance}</span>
                </div>
              )}
              {maire.libelleNuance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Libellé nuance</span>
                  <span className="font-medium text-gray-900 dark:text-white">{maire.libelleNuance}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sources */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sources : Répertoire National des Élus (data.gouv.fr)
        </div>
      </div>
    </>
  );
}
