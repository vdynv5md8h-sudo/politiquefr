import axios, { AxiosError, AxiosRequestConfig } from 'axios';

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
  recherche: (q: string) => get<unknown[]>('/deputes/recherche', { params: { q } }),
  stats: () => get<unknown>('/deputes/stats'),
};

// Sénateurs
export const senateursApi = {
  liste: (params?: { page?: number; limite?: number; groupeId?: string }) =>
    get<unknown[]>('/senateurs', { params }),
  detail: (id: string) => get<unknown>(`/senateurs/${id}`),
  recherche: (q: string) => get<unknown[]>('/senateurs/recherche', { params: { q } }),
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
