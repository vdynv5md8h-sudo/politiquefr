import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { reponseSucces, reponseNonTrouve } from '../utils/reponse';
import path from 'path';
import fs from 'fs';

// Chemins vers les fichiers GeoJSON
const GEOJSON_DIR = path.join(__dirname, '../../..', 'data', 'geojson');

export async function circonscriptionsGeoJson(_req: Request, res: Response): Promise<Response> {
  const cheminFichier = path.join(GEOJSON_DIR, 'circonscriptions.geojson');

  if (!fs.existsSync(cheminFichier)) {
    // Retourner un GeoJSON vide si le fichier n'existe pas encore
    return reponseSucces(res, {
      type: 'FeatureCollection',
      features: [],
      message: 'Fichier GeoJSON des circonscriptions non encore chargé',
    });
  }

  const donnees = JSON.parse(fs.readFileSync(cheminFichier, 'utf-8'));
  return reponseSucces(res, donnees);
}

export async function departementsGeoJson(_req: Request, res: Response): Promise<Response> {
  const cheminFichier = path.join(GEOJSON_DIR, 'departements.geojson');

  if (!fs.existsSync(cheminFichier)) {
    return reponseSucces(res, {
      type: 'FeatureCollection',
      features: [],
      message: 'Fichier GeoJSON des départements non encore chargé',
    });
  }

  const donnees = JSON.parse(fs.readFileSync(cheminFichier, 'utf-8'));
  return reponseSucces(res, donnees);
}

export async function regionsGeoJson(_req: Request, res: Response): Promise<Response> {
  const cheminFichier = path.join(GEOJSON_DIR, 'regions.geojson');

  if (!fs.existsSync(cheminFichier)) {
    return reponseSucces(res, {
      type: 'FeatureCollection',
      features: [],
      message: 'Fichier GeoJSON des régions non encore chargé',
    });
  }

  const donnees = JSON.parse(fs.readFileSync(cheminFichier, 'utf-8'));
  return reponseSucces(res, donnees);
}

export async function deputeCirconscription(req: Request, res: Response): Promise<Response> {
  const { codeDept, numCirco } = req.params;
  const numero = parseInt(numCirco, 10);

  const depute = await prisma.depute.findFirst({
    where: {
      OR: [
        { codeDepartement: codeDept },
        { departement: { contains: codeDept } },
      ],
      numeroCirconscription: numero,
      mandatEnCours: true,
    },
    include: {
      groupe: {
        select: { id: true, acronyme: true, nom: true, couleur: true },
      },
    },
  });

  if (!depute) {
    return reponseNonTrouve(res, 'Député pour cette circonscription');
  }

  return reponseSucces(res, depute);
}

export async function elusDepartement(req: Request, res: Response): Promise<Response> {
  const { code } = req.params;

  const [deputes, senateurs, maires] = await Promise.all([
    prisma.depute.findMany({
      where: {
        OR: [
          { codeDepartement: code },
          { departement: { contains: code } },
        ],
        mandatEnCours: true,
      },
      include: {
        groupe: { select: { id: true, acronyme: true, couleur: true } },
      },
    }),
    prisma.senateur.findMany({
      where: { codeDepartement: code, mandatEnCours: true },
      include: {
        groupe: { select: { id: true, acronyme: true, couleur: true } },
      },
    }),
    prisma.maire.count({
      where: { codeDepartement: code },
    }),
  ]);

  return reponseSucces(res, {
    deputes,
    senateurs,
    nombreMaires: maires,
  });
}
