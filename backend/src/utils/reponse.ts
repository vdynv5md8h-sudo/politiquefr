import { Response } from 'express';

// Interface pour la pagination
export interface InfosPagination {
  page: number;
  limite: number;
  total: number;
  totalPages: number;
  suivant: boolean;
  precedent: boolean;
}

// Interface pour une réponse API standard
export interface ReponseApi<T> {
  succes: boolean;
  donnees?: T;
  message?: string;
  pagination?: InfosPagination;
  erreurs?: string[];
}

// Réponse de succès
export function reponseSucces<T>(
  res: Response,
  donnees: T,
  statut = 200,
  pagination?: InfosPagination
): Response {
  const reponse: ReponseApi<T> = {
    succes: true,
    donnees,
  };

  if (pagination) {
    reponse.pagination = pagination;
  }

  return res.status(statut).json(reponse);
}

// Réponse d'erreur
export function reponseErreur(
  res: Response,
  message: string,
  statut = 400,
  erreurs?: string[]
): Response {
  const reponse: ReponseApi<null> = {
    succes: false,
    message,
    erreurs,
  };

  return res.status(statut).json(reponse);
}

// Réponse créée
export function reponseCree<T>(res: Response, donnees: T): Response {
  return reponseSucces(res, donnees, 201);
}

// Réponse non trouvé
export function reponseNonTrouve(res: Response, message = 'Ressource non trouvée'): Response {
  return reponseErreur(res, message, 404);
}

// Réponse non autorisé
export function reponseNonAutorise(res: Response, message = 'Non autorisé'): Response {
  return reponseErreur(res, message, 401);
}

// Réponse interdit
export function reponseInterdit(res: Response, message = 'Accès interdit'): Response {
  return reponseErreur(res, message, 403);
}

// Calculer les infos de pagination
export function calculerPagination(
  page: number,
  limite: number,
  total: number
): InfosPagination {
  const totalPages = Math.ceil(total / limite);

  return {
    page,
    limite,
    total,
    totalPages,
    suivant: page < totalPages,
    precedent: page > 1,
  };
}

// Parser les paramètres de pagination depuis la query
export function parserPagination(query: {
  page?: string;
  limite?: string;
}): { page: number; limite: number; skip: number } {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limite = Math.min(100, Math.max(1, parseInt(query.limite || '50', 10)));
  const skip = (page - 1) * limite;

  return { page, limite, skip };
}
