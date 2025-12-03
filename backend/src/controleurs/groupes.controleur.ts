import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { reponseSucces, reponseNonTrouve } from '../utils/reponse';

export async function listerGroupes(_req: Request, res: Response): Promise<Response> {
  const groupes = await prisma.groupePolitique.findMany({
    where: { actif: true },
    orderBy: [{ chambre: 'asc' }, { nombreMembres: 'desc' }],
  });

  return reponseSucces(res, groupes);
}

export async function groupesAssemblee(_req: Request, res: Response): Promise<Response> {
  const groupes = await prisma.groupePolitique.findMany({
    where: { chambre: 'ASSEMBLEE', actif: true },
    orderBy: { nombreMembres: 'desc' },
  });

  return reponseSucces(res, groupes);
}

export async function groupesSenat(_req: Request, res: Response): Promise<Response> {
  const groupes = await prisma.groupePolitique.findMany({
    where: { chambre: 'SENAT', actif: true },
    orderBy: { nombreMembres: 'desc' },
  });

  return reponseSucces(res, groupes);
}

export async function compositionGroupes(_req: Request, res: Response): Promise<Response> {
  const [assemblee, senat] = await Promise.all([
    prisma.groupePolitique.findMany({
      where: { chambre: 'ASSEMBLEE', actif: true },
      orderBy: { nombreMembres: 'desc' },
      select: { id: true, acronyme: true, nom: true, couleur: true, nombreMembres: true, positionPolitique: true },
    }),
    prisma.groupePolitique.findMany({
      where: { chambre: 'SENAT', actif: true },
      orderBy: { nombreMembres: 'desc' },
      select: { id: true, acronyme: true, nom: true, couleur: true, nombreMembres: true, positionPolitique: true },
    }),
  ]);

  return reponseSucces(res, { assemblee, senat });
}

export async function detailGroupe(req: Request, res: Response): Promise<Response> {
  const groupe = await prisma.groupePolitique.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { deputes: true, senateurs: true } },
    },
  });

  if (!groupe) return reponseNonTrouve(res, 'Groupe politique');
  return reponseSucces(res, groupe);
}

export async function membresGroupe(req: Request, res: Response): Promise<Response> {
  const groupe = await prisma.groupePolitique.findUnique({
    where: { id: req.params.id },
    select: { id: true, chambre: true },
  });

  if (!groupe) return reponseNonTrouve(res, 'Groupe politique');

  let membres;
  if (groupe.chambre === 'ASSEMBLEE') {
    membres = await prisma.depute.findMany({
      where: { groupeId: groupe.id, mandatEnCours: true },
      orderBy: { nom: 'asc' },
      select: { id: true, civilite: true, prenom: true, nom: true, departement: true, photoUrl: true },
    });
  } else {
    membres = await prisma.senateur.findMany({
      where: { groupeId: groupe.id, mandatEnCours: true },
      orderBy: { nom: 'asc' },
      select: { id: true, civilite: true, prenom: true, nom: true, departement: true, photoUrl: true },
    });
  }

  return reponseSucces(res, { chambre: groupe.chambre, membres });
}

export async function votesGroupe(req: Request, res: Response): Promise<Response> {
  const groupe = await prisma.groupePolitique.findUnique({
    where: { id: req.params.id },
    select: { id: true, chambre: true },
  });

  if (!groupe) return reponseNonTrouve(res, 'Groupe politique');

  // Récupérer les IDs des membres du groupe
  let membresIds: string[] = [];
  if (groupe.chambre === 'ASSEMBLEE') {
    const deputes = await prisma.depute.findMany({
      where: { groupeId: groupe.id },
      select: { id: true },
    });
    membresIds = deputes.map((d) => d.id);

    const stats = await prisma.voteDepute.groupBy({
      by: ['position'],
      where: { deputeId: { in: membresIds } },
      _count: { id: true },
    });

    return reponseSucces(res, {
      pour: stats.find((s) => s.position === 'POUR')?._count.id || 0,
      contre: stats.find((s) => s.position === 'CONTRE')?._count.id || 0,
      abstention: stats.find((s) => s.position === 'ABSTENTION')?._count.id || 0,
    });
  } else {
    const senateurs = await prisma.senateur.findMany({
      where: { groupeId: groupe.id },
      select: { id: true },
    });
    membresIds = senateurs.map((s) => s.id);

    const stats = await prisma.voteSenateur.groupBy({
      by: ['position'],
      where: { senateurId: { in: membresIds } },
      _count: { id: true },
    });

    return reponseSucces(res, {
      pour: stats.find((s) => s.position === 'POUR')?._count.id || 0,
      contre: stats.find((s) => s.position === 'CONTRE')?._count.id || 0,
      abstention: stats.find((s) => s.position === 'ABSTENTION')?._count.id || 0,
    });
  }
}
