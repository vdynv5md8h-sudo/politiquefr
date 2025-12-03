import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { ErreurNonAutorise, ErreurInterdit } from './erreur.middleware';
import { prisma } from '../config/database';

// Types pour JWT
export interface PayloadJwt {
  userId: string;
  email: string;
  role: string;
}

// Extension du type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      utilisateur?: PayloadJwt;
    }
  }
}

// Générer un token JWT
export function genererToken(payload: PayloadJwt): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '8h',
    algorithm: 'HS256',
    issuer: 'politiquefr',
    audience: 'politiquefr-admin',
  });
}

// Vérifier un token JWT
export function verifierToken(token: string): PayloadJwt {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'politiquefr',
      audience: 'politiquefr-admin',
    }) as PayloadJwt;
    return decoded;
  } catch {
    throw new ErreurNonAutorise('Token invalide ou expiré');
  }
}

// Middleware d'authentification
export async function authentification(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ErreurNonAutorise('Token manquant');
    }

    const token = authHeader.substring(7); // Retirer "Bearer "
    const payload = verifierToken(token);

    // Vérifier que l'utilisateur existe toujours et est actif
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: payload.userId },
    });

    if (!utilisateur || !utilisateur.actif) {
      throw new ErreurNonAutorise('Utilisateur non autorisé');
    }

    // Ajouter l'utilisateur à la requête
    req.utilisateur = payload;
    next();
  } catch (erreur) {
    next(erreur);
  }
}

// Middleware pour vérifier le rôle admin
export function autoriserAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.utilisateur) {
    throw new ErreurNonAutorise('Non authentifié');
  }

  if (req.utilisateur.role !== 'ADMIN') {
    throw new ErreurInterdit('Accès réservé aux administrateurs');
  }

  next();
}

// Middleware pour vérifier un rôle spécifique
export function autoriserRoles(...rolesAutorises: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.utilisateur) {
      throw new ErreurNonAutorise('Non authentifié');
    }

    if (!rolesAutorises.includes(req.utilisateur.role)) {
      throw new ErreurInterdit('Accès non autorisé pour ce rôle');
    }

    next();
  };
}
