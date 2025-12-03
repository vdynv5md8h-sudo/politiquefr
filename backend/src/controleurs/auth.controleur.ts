import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { genererToken } from '../middleware/auth.middleware';
import { ErreurNonAutorise } from '../middleware/erreur.middleware';
import { reponseSucces } from '../utils/reponse';
import { logInfo } from '../utils/logger';

const schemaConnexion = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(8),
});

export async function connexion(req: Request, res: Response): Promise<Response> {
  const { email, motDePasse } = schemaConnexion.parse(req.body);

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email },
  });

  if (!utilisateur || !utilisateur.actif) {
    throw new ErreurNonAutorise('Email ou mot de passe incorrect');
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
  if (!motDePasseValide) {
    throw new ErreurNonAutorise('Email ou mot de passe incorrect');
  }

  // Mettre à jour la dernière connexion
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { derniereConnexion: new Date() },
  });

  // Générer le token
  const token = genererToken({
    userId: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
  });

  // Logger la connexion
  await prisma.journalAudit.create({
    data: {
      utilisateurId: utilisateur.id,
      action: 'CONNEXION',
      typeEntite: 'Utilisateur',
      entiteId: utilisateur.id,
      adresseIp: req.ip,
    },
  });

  logInfo('Connexion admin', { email: utilisateur.email });

  return reponseSucces(res, {
    token,
    utilisateur: {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      role: utilisateur.role,
    },
  });
}

export async function deconnexion(req: Request, res: Response): Promise<Response> {
  // Logger la déconnexion
  if (req.utilisateur) {
    await prisma.journalAudit.create({
      data: {
        utilisateurId: req.utilisateur.userId,
        action: 'DECONNEXION',
        typeEntite: 'Utilisateur',
        entiteId: req.utilisateur.userId,
        adresseIp: req.ip,
      },
    });
  }

  return reponseSucces(res, { message: 'Déconnexion réussie' });
}

export async function utilisateurCourant(req: Request, res: Response): Promise<Response> {
  if (!req.utilisateur) {
    throw new ErreurNonAutorise();
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: req.utilisateur.userId },
    select: {
      id: true,
      email: true,
      nom: true,
      role: true,
      derniereConnexion: true,
      createdAt: true,
    },
  });

  if (!utilisateur) {
    throw new ErreurNonAutorise();
  }

  return reponseSucces(res, utilisateur);
}

export async function rafraichirToken(req: Request, res: Response): Promise<Response> {
  if (!req.utilisateur) {
    throw new ErreurNonAutorise();
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: req.utilisateur.userId },
  });

  if (!utilisateur || !utilisateur.actif) {
    throw new ErreurNonAutorise();
  }

  const nouveauToken = genererToken({
    userId: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
  });

  return reponseSucces(res, { token: nouveauToken });
}
