import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logError } from '../utils/logger';
import { estProduction } from '../config/env';

// Classe d'erreur personnalisée pour l'API
export class ErreurApi extends Error {
  public statut: number;
  public estOperationnelle: boolean;

  constructor(message: string, statut = 500, estOperationnelle = true) {
    super(message);
    this.statut = statut;
    this.estOperationnelle = estOperationnelle;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erreurs spécifiques
export class ErreurNonTrouve extends ErreurApi {
  constructor(ressource = 'Ressource') {
    super(`${ressource} non trouvé(e)`, 404);
  }
}

export class ErreurNonAutorise extends ErreurApi {
  constructor(message = 'Non autorisé') {
    super(message, 401);
  }
}

export class ErreurInterdit extends ErreurApi {
  constructor(message = 'Accès interdit') {
    super(message, 403);
  }
}

export class ErreurValidation extends ErreurApi {
  public erreurs: string[];

  constructor(erreurs: string[]) {
    super('Erreur de validation', 400);
    this.erreurs = erreurs;
  }
}

// Middleware de gestion des erreurs
export function gestionnaireErreurs(
  erreur: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Log de l'erreur
  logError('Erreur API', erreur);

  // Erreur Zod (validation)
  if (erreur instanceof ZodError) {
    const messages = erreur.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: messages,
    });
  }

  // Erreur de validation personnalisée
  if (erreur instanceof ErreurValidation) {
    return res.status(erreur.statut).json({
      succes: false,
      message: erreur.message,
      erreurs: erreur.erreurs,
    });
  }

  // Erreur API personnalisée
  if (erreur instanceof ErreurApi) {
    return res.status(erreur.statut).json({
      succes: false,
      message: erreur.message,
    });
  }

  // Erreur de syntaxe JSON
  if (erreur instanceof SyntaxError && 'body' in erreur) {
    return res.status(400).json({
      succes: false,
      message: 'JSON invalide dans le corps de la requête',
    });
  }

  // Erreur inconnue
  return res.status(500).json({
    succes: false,
    message: estProduction ? 'Erreur serveur interne' : erreur.message,
    ...(estProduction ? {} : { stack: erreur.stack }),
  });
}

// Middleware pour les routes non trouvées
export function routeNonTrouvee(_req: Request, res: Response): Response {
  return res.status(404).json({
    succes: false,
    message: 'Route non trouvée',
  });
}

// Wrapper pour les fonctions async (évite try-catch répétitifs)
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
