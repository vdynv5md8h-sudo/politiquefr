import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { TravauxParlementaire, CommissionEnquete, ResumeLLM, IndicateurStatistique, Amendement, AmendementStats, SortAmendement } from '../types';

// Configuration de base
// En développement: utilise le proxy Vite vers localhost:3001
// En production: utilise l'URL de l'API Render
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : import.meta.env.PROD
    ? 'https://politiquefr-api-a0w4.onrender.com/api/v1'
    : '/api/v1';

// Instance Axios configurée
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      // Rediriger vers la page de connexion si nécessaire
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/connexion';
      }
    }
    return Promise.reject(error);
  }
);

// Types de réponse API
export interface ReponseApi<T> {
  succes: boolean;
  donnees?: T;
  message?: string;
  pagination?: {
    page: number;
    limite: number;
    total: number;
    totalPages: number;
    suivant: boolean;
    precedent: boolean;
  };
  erreurs?: string[];
}

// Fonction générique pour les requêtes GET
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ReponseApi<T>> {
  const response = await api.get<ReponseApi<T>>(url, config);
  return response.data;
}

// Fonction générique pour les requêtes POST
export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ReponseApi<T>> {
  const response = await api.post<ReponseApi<T>>(url, data, config);
  return response.data;
}

// Fonction générique pour les requêtes PUT
export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ReponseApi<T>> {
  const response = await api.put<ReponseApi<T>>(url, data, config);
  return response.data;
}

// Fonction générique pour les requêtes DELETE
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<ReponseApi<T>> {
  const response = await api.delete<ReponseApi<T>>(url, config);
  return response.data;
}

// Services spécifiques

// Députés
export const deputesApi = {
  liste: (params?: { page?: number; limite?: number; groupeId?: string; departement?: string }) =>
    get<unknown[]>('/deputes', { params }),
  detail: (id: string) => get<unknown>(`/deputes/${id}`),
  votes: (id: string, page?: number) => get<unknown>(`/deputes/${id}/votes`, { params: { page } }),
  activite: (id: string) => get<unknown>(`/deputes/${id}/activite`),
  questions: (id: string, params?: { page?: number; type?: string }) =>
    get<unknown>(`/deputes/${id}/questions`, { params }),
  recherche: (q: string) => get<unknown[]>('/deputes/recherche', { params: { q } }),
  stats: () => get<unknown>('/deputes/stats'),
};

// Sénateurs
export const senateursApi = {
  liste: (params?: { page?: number; limite?: number; groupeId?: string }) =>
    get<unknown[]>('/senateurs', { params }),
  detail: (id: string) => get<unknown>(`/senateurs/${id}`),
  activite: (id: string) => get<unknown>(`/senateurs/${id}/activite`),
  votes: (id: string, page?: number) => get<unknown>(`/senateurs/${id}/votes`, { params: { page } }),
  recherche: (q: string) => get<unknown[]>('/senateurs/recherche', { params: { q } }),
  stats: () => get<unknown>('/senateurs/stats'),
};

// Maires
export const mairesApi = {
  liste: (params?: { page?: number; limite?: number; codeDepartement?: string }) =>
    get<unknown[]>('/maires', { params }),
  detail: (id: string) => get<unknown>(`/maires/${id}`),
  parCommune: (codeCommune: string) => get<unknown>(`/maires/par-commune/${codeCommune}`),
  recherche: (q: string) => get<unknown[]>('/maires/recherche', { params: { q } }),
};

// Groupes politiques
export const groupesApi = {
  liste: () => get<unknown[]>('/groupes'),
  assemblee: () => get<unknown[]>('/groupes/assemblee'),
  senat: () => get<unknown[]>('/groupes/senat'),
  composition: () => get<unknown>('/groupes/composition'),
  detail: (id: string) => get<unknown>(`/groupes/${id}`),
  membres: (id: string) => get<unknown>(`/groupes/${id}/membres`),
};

// Lois
export const loisApi = {
  liste: (params?: { page?: number; statut?: string; type?: string }) =>
    get<unknown[]>('/lois', { params }),
  detail: (id: string) => get<unknown>(`/lois/${id}`),
  recentes: () => get<unknown[]>('/lois/recentes'),
  timeline: (id: string) => get<unknown>(`/lois/${id}/timeline`),
  themes: () => get<unknown[]>('/lois/themes'),
};

// Scrutins
export const scrutinsApi = {
  liste: (params?: { page?: number; chambre?: string }) =>
    get<unknown[]>('/scrutins', { params }),
  detail: (id: string) => get<unknown>(`/scrutins/${id}`),
  repartition: (id: string) => get<unknown>(`/scrutins/${id}/repartition`),
  recents: () => get<unknown[]>('/scrutins/recents'),
};

// Actualités
export const actualitesApi = {
  liste: (params?: { page?: number }) => get<unknown[]>('/actualites', { params }),
  detail: (id: string) => get<unknown>(`/actualites/${id}`),
  parCategorie: (categorie: string, params?: { page?: number }) =>
    get<unknown[]>(`/actualites/par-categorie/${categorie}`, { params }),
  affairesJudiciaires: () => get<unknown[]>('/actualites/affaires-judiciaires'),
};

// Recherche
export const rechercheApi = {
  globale: (q: string, type?: string) => get<unknown>('/recherche', { params: { q, type } }),
  autocomplete: (q: string) => get<unknown[]>('/recherche/autocomplete', { params: { q } }),
};

// Géographie
export const geoApi = {
  circonscriptions: () => get<unknown>('/geo/circonscriptions'),
  departements: () => get<unknown>('/geo/departements'),
  regions: () => get<unknown>('/geo/regions'),
  deputeCirconscription: (codeDept: string, numCirco: number) =>
    get<unknown>(`/geo/circonscription/${codeDept}/${numCirco}/depute`),
};

// Dashboard
export const dashboardApi = {
  get: () => get<unknown>('/dashboard'),
};

// Types pour les statistiques
interface TravauxStats {
  total: number;
  parType: { type: string; nombre: number }[];
  parStatut: { statut: string; nombre: number }[];
  parLegislature: { legislature: number; nombre: number }[];
}

// Travaux parlementaires
export const travauxApi = {
  liste: (params?: { page?: number; limite?: number; type?: string; statut?: string; legislature?: number }) =>
    get<TravauxParlementaire[]>('/travaux-parlementaires', { params }),
  detail: (id: string) => get<TravauxParlementaire>(`/travaux-parlementaires/${id}`),
  recents: () => get<TravauxParlementaire[]>('/travaux-parlementaires/recents'),
  projetsLoi: (params?: { page?: number; limite?: number }) =>
    get<TravauxParlementaire[]>('/travaux-parlementaires/projets-loi', { params }),
  propositionsLoi: (params?: { page?: number; limite?: number }) =>
    get<TravauxParlementaire[]>('/travaux-parlementaires/propositions-loi', { params }),
  textesAdoptes: (params?: { page?: number; limite?: number }) =>
    get<TravauxParlementaire[]>('/travaux-parlementaires/textes-adoptes', { params }),
  stats: () => get<TravauxStats>('/travaux-parlementaires/stats'),
  resume: (id: string, type?: string) =>
    get<ResumeLLM>(`/travaux-parlementaires/${id}/resume`, { params: { type } }),
  regenererResume: (id: string, type?: string) =>
    post<ResumeLLM>(`/travaux-parlementaires/${id}/resume`, { type }),
  indicateurs: (id: string) => get<IndicateurStatistique[]>(`/travaux-parlementaires/${id}/indicateurs`),
  timeline: (id: string) => get<{ travaux: TravauxParlementaire; timeline: { etape: string; date: string | null; statut: string }[] }>(`/travaux-parlementaires/${id}/timeline`),
};

// Commissions d'enquête
export const commissionsEnqueteApi = {
  liste: (params?: { page?: number; limite?: number; chambre?: string; statut?: string }) =>
    get<CommissionEnquete[]>('/commissions-enquete', { params }),
  detail: (id: string) => get<CommissionEnquete>(`/commissions-enquete/${id}`),
  enCours: () => get<CommissionEnquete[]>('/commissions-enquete/en-cours'),
  stats: () => get<{ total: number; parChambre: { chambre: string; nombre: number }[]; parStatut: { statut: string; nombre: number }[] }>('/commissions-enquete/stats'),
  resume: (id: string, type?: string) =>
    get<ResumeLLM>(`/commissions-enquete/${id}/resume`, { params: { type } }),
  regenererResume: (id: string, type?: string) =>
    post<ResumeLLM>(`/commissions-enquete/${id}/resume`, { type }),
};

// Amendements
export const amendementsApi = {
  liste: (params?: { page?: number; limite?: number; sort?: SortAmendement; legislature?: number; travauxId?: string; auteurRef?: string; tri?: 'dateDepot' | 'numero' | 'sort'; ordre?: 'asc' | 'desc' }) =>
    get<Amendement[]>('/amendements', { params }),
  detail: (id: string) => get<Amendement>(`/amendements/${id}`),
  recents: () => get<Amendement[]>('/amendements/recents'),
  stats: () => get<AmendementStats>('/amendements/stats'),
};
