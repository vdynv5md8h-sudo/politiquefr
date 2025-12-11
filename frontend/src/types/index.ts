// Types pour les élus

export interface Maire {
  id: string;
  rneId: string;
  civilite: string;
  prenom: string;
  nom: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  profession?: string;
  codeCommune: string;
  libelleCommune: string;
  codeDepartement: string;
  libelleDepartement: string;
  codeRegion?: string;
  libelleRegion?: string;
  dateDebutMandat: string;
  dateFinMandat?: string;
  fonctionMandat: string;
  codeNuance?: string;
  libelleNuance?: string;
  email?: string;
  telephone?: string;
  siteWeb?: string;
  photoUrl?: string;
}

export interface Depute {
  id: string;
  slug: string;
  civilite: string;
  prenom: string;
  nom: string;
  nomUsuel?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  profession?: string;
  legislature: number;
  numeroCirconscription: number;
  departement: string;
  codeDepartement?: string;
  dateDebutMandat: string;
  dateFinMandat?: string;
  motifFin?: string;
  mandatEnCours: boolean;
  groupeId?: string;
  groupe?: GroupePolitique;
  presenceCommission?: number;
  presenceHemicycle?: number;
  participationScrutins?: number;
  questionsEcrites?: number;
  questionsOrales?: number;
  propositionsLoi?: number;
  rapports?: number;
  interventions?: number;
  amendementsProposes?: number;
  amendementsAdoptes?: number;
  email?: string;
  twitter?: string;
  facebook?: string;
  siteWeb?: string;
  photoUrl?: string;
  urlNosdeputes?: string;
  urlAssemblee?: string;
}

export interface Senateur {
  id: string;
  matricule: string;
  civilite: string;
  prenom: string;
  nom: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  profession?: string;
  departement: string;
  codeDepartement: string;
  serieSenat: number;
  dateDebutMandat: string;
  dateFinMandat?: string;
  typeElection?: string;
  mandatEnCours: boolean;
  groupeId?: string;
  groupe?: GroupePolitique;
  presenceCommission?: number;
  presenceSeance?: number;
  questionsEcrites?: number;
  questionsOrales?: number;
  propositionsLoi?: number;
  rapports?: number;
  email?: string;
  twitter?: string;
  siteWeb?: string;
  photoUrl?: string;
  urlSenat?: string;
}

// Types pour les groupes politiques

export type Chambre = 'ASSEMBLEE' | 'SENAT';

export interface GroupePolitique {
  id: string;
  acronyme: string;
  nom: string;
  chambre: Chambre;
  ideologie?: string;
  positionPolitique?: string;
  description?: string;
  couleur?: string;
  nombreMembres: number;
  siteWeb?: string;
  logoUrl?: string;
  dateCreation?: string;
  actif: boolean;
}

// Types pour les lois

export type TypeLoi =
  | 'PROJET_LOI'
  | 'PROPOSITION_LOI'
  | 'PROJET_LOI_ORGANIQUE'
  | 'PROPOSITION_LOI_ORGANIQUE'
  | 'PROJET_LOI_FINANCES'
  | 'PROJET_LOI_REGLEMENT'
  | 'PROJET_LOI_FINANCEMENT_SECU'
  | 'PROPOSITION_RESOLUTION';

export type StatutLoi =
  | 'DEPOSE'
  | 'EN_COMMISSION'
  | 'EN_SEANCE'
  | 'ADOPTE_PREMIERE_LECTURE'
  | 'NAVETTE'
  | 'ADOPTE_DEFINITIF'
  | 'PROMULGUE'
  | 'REJETE'
  | 'RETIRE'
  | 'CADUQUE';

export interface Loi {
  id: string;
  dossierId: string;
  titre: string;
  titreOfficiel?: string;
  titreCourt?: string;
  type: TypeLoi;
  statut: StatutLoi;
  dateDepot: string;
  dateAdoption?: string;
  datePromulgation?: string;
  numeroJo?: string;
  resume?: string;
  exposeDesMotifs?: string;
  urlDossier?: string;
  urlTexte?: string;
  auteurs?: string;
  rapporteurs?: string;
  themeId?: string;
  theme?: ThemeLoi;
}

export interface ThemeLoi {
  id: string;
  nom: string;
}

// Types pour les scrutins et votes

export type PositionVote = 'POUR' | 'CONTRE' | 'ABSTENTION' | 'NON_VOTANT';
export type ResultatScrutin = 'ADOPTE' | 'REJETE';

export interface Scrutin {
  id: string;
  numeroScrutin: number;
  chambre: Chambre;
  legislature?: number;
  dateScrutin: string;
  seance?: string;
  titre: string;
  objet?: string;
  loiId?: string;
  loi?: Loi;
  nombreVotants: number;
  nombreSuffrages: number;
  majoriteAbsolue: number;
  pour: number;
  contre: number;
  abstention: number;
  resultat: ResultatScrutin;
  urlScrutin?: string;
}

export interface VoteDepute {
  id: string;
  deputeId: string;
  scrutinId: string;
  scrutin?: Scrutin;
  position: PositionVote;
  parDelegation: boolean;
}

// Types pour les promesses

export type StatutPromesse =
  | 'NON_EVALUEE'
  | 'EN_COURS'
  | 'PARTIELLEMENT_TENUE'
  | 'TENUE'
  | 'NON_TENUE'
  | 'ABANDONNEE';

export interface Promesse {
  id: string;
  titre: string;
  description?: string;
  source?: string;
  datePromesse?: string;
  statut: StatutPromesse;
  evaluation?: string;
  dateEvaluation?: string;
}

// Types pour les actualités

export type CategorieActualite =
  | 'POLITIQUE_GENERALE'
  | 'ASSEMBLEE'
  | 'SENAT'
  | 'GOUVERNEMENT'
  | 'ELECTIONS'
  | 'AFFAIRES_JUDICIAIRES'
  | 'CONTROVERSES'
  | 'ECONOMIE'
  | 'SOCIAL'
  | 'INTERNATIONAL';

export interface ArticleActualite {
  id: string;
  titre: string;
  contenu: string;
  resume?: string;
  source: string;
  sourceUrl?: string;
  auteur?: string;
  categorie: CategorieActualite;
  tags?: string;
  datePublication: string;
  imageUrl?: string;
}

// Types pour les affaires judiciaires

export type TypeAffaire =
  | 'CORRUPTION'
  | 'ABUS_DE_CONFIANCE'
  | 'DETOURNEMENT_FONDS'
  | 'PRISE_ILLEGALE_INTERETS'
  | 'EMPLOI_FICTIF'
  | 'FRAUDE_FISCALE'
  | 'FINANCEMENT_ILLEGAL_CAMPAGNE'
  | 'DIFFAMATION'
  | 'HARCELEMENT'
  | 'AUTRE';

export type StatutAffaire =
  | 'ENQUETE'
  | 'INSTRUCTION'
  | 'PROCES'
  | 'CONDAMNE'
  | 'RELAXE'
  | 'APPEL'
  | 'CASSATION'
  | 'PRESCRIT'
  | 'CLASSE_SANS_SUITE'
  | 'NON_LIEU';

export interface AffaireJudiciaire {
  id: string;
  titre: string;
  description: string;
  personnes: string;
  type: TypeAffaire;
  dateDebut: string;
  dateJugement?: string;
  statut: StatutAffaire;
  juridiction?: string;
  reference?: string;
  derniereActualite?: string;
  dateActualite?: string;
  sources?: string;
}

// Types pour les questions parlementaires

export type TypeQuestion = 'QE' | 'QG' | 'QOSD';

export interface Question {
  id: string;
  uid: string;
  type: TypeQuestion;
  numero: number;
  rubrique?: string;
  analyse?: string;
  texteQuestion: string;
  texteReponse?: string;
  ministereAcronyme?: string;
  ministereDeveloppe?: string;
  dateQuestion: string;
  dateReponse?: string;
  statut?: string;
  groupeAcronyme?: string;
}

// Types pour la pagination
export interface Pagination {
  page: number;
  limite: number;
  total: number;
  totalPages: number;
  suivant: boolean;
  precedent: boolean;
}

// Types pour la recherche
export interface ResultatRecherche {
  type: 'depute' | 'senateur' | 'maire' | 'groupe' | 'loi';
  id: string;
  titre: string;
  sousTitre?: string;
  score: number;
}

// ==================== TRAVAUX PARLEMENTAIRES ====================

export type TypeDocumentParlement =
  | 'PROJET_LOI'
  | 'PROPOSITION_LOI'
  | 'PROJET_LOI_ORGANIQUE'
  | 'PROPOSITION_LOI_ORGANIQUE'
  | 'PROJET_LOI_FINANCES'
  | 'PROJET_LOI_REGLEMENT'
  | 'PROJET_LOI_FINANCEMENT_SECU'
  | 'PROPOSITION_RESOLUTION'
  | 'TEXTE_ADOPTE'
  | 'RAPPORT'
  | 'RAPPORT_INFORMATION'
  | 'AVIS';

export type StatutExamenTravaux =
  | 'EN_ATTENTE'
  | 'EN_COMMISSION'
  | 'EN_SEANCE'
  | 'PREMIERE_LECTURE_AN'
  | 'PREMIERE_LECTURE_SENAT'
  | 'DEUXIEME_LECTURE'
  | 'CMP'
  | 'LECTURE_DEFINITIVE'
  | 'ADOPTE'
  | 'PROMULGUE'
  | 'REJETE'
  | 'RETIRE'
  | 'CADUQUE';

export interface ThemeTravaux {
  id: string;
  code: string;
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
}

export interface CommissionParlementaire {
  id: string;
  uid: string;
  nom: string;
  nomCourt?: string;
  typeCommission: 'PERMANENTE' | 'SPECIALE' | 'ENQUETE' | 'MIXTE_PARITAIRE';
  chambre: Chambre;
  legislature: number;
  actif: boolean;
}

export interface TravauxParlementaire {
  id: string;
  uid: string;
  typeDocument: TypeDocumentParlement;
  titre: string;
  titreOfficiel?: string;
  titreCourt?: string;
  legislature: number;
  dateDepot: string;
  dateExamen?: string;
  dateAdoption?: string;
  datePromulgation?: string;
  chambreOrigine: Chambre;
  statutExamen: StatutExamenTravaux;
  exposeSommaire?: string;
  urlDocumentPdf?: string;
  urlDossierAN?: string;
  auteurs?: string;
  commission?: CommissionParlementaire;
  theme?: ThemeTravaux;
  resumes?: ResumeLLM[];
  indicateurs?: IndicateurStatistique[];
}

// ==================== COMMISSIONS D'ENQUETE ====================

export type StatutCommissionEnquete =
  | 'EN_COURS'
  | 'TERMINE'
  | 'RAPPORT_DEPOSE'
  | 'ARCHIVE';

export interface CommissionEnquete {
  id: string;
  uid: string;
  titre: string;
  sujet: string;
  legislature: number;
  chambre: Chambre;
  dateCreation: string;
  dateFin?: string;
  presidentNom?: string;
  rapporteurNom?: string;
  nombreMembres?: number;
  statut: StatutCommissionEnquete;
  urlRapportFinal?: string;
  resumes?: ResumeLLM[];
}

// ==================== RESUMES LLM ====================

export type TypeResume =
  | 'COURT'
  | 'MOYEN'
  | 'LONG'
  | 'POINTS_CLES'
  | 'VULGARISE';

export interface ResumeLLM {
  id: string;
  travauxId?: string;
  commissionEnqueteId?: string;
  typeResume: TypeResume;
  contenu: string;
  modeleLLM: string;
  tokensEntree?: number;
  tokensSortie?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== INDICATEURS INSEE ====================

export interface IndicateurStatistique {
  id: string;
  codeInsee?: string;
  nom: string;
  description?: string;
  valeurActuelle?: number;
  dateValeur?: string;
  unite?: string;
  variationAnnuelle?: number;
  theme?: ThemeTravaux;
  urlSource?: string;
}

// ==================== TIMELINE ====================

export interface EtapeTimeline {
  etape: string;
  date: string;
  statut: 'termine' | 'en_cours' | 'a_venir';
}
