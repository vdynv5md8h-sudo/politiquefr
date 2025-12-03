import { Request, Response } from 'express';
import { z } from 'zod';
import Fuse from 'fuse.js';
import { prisma } from '../config/database';
import { reponseSucces } from '../utils/reponse';
import { obtenirCache, definirCache } from '../middleware/cache.middleware';

const schemaRecherche = z.object({
  q: z.string().min(2).max(100),
  type: z.enum(['tout', 'maires', 'deputes', 'senateurs', 'groupes', 'lois']).optional(),
  limite: z.string().optional(),
});

// Index de recherche (mis en cache)
interface IndexRecherche {
  maires: Array<{ id: string; nom: string; prenom: string; commune: string; departement: string }>;
  deputes: Array<{ id: string; slug: string; nom: string; prenom: string; departement: string; groupe?: string }>;
  senateurs: Array<{ id: string; nom: string; prenom: string; departement: string; groupe?: string }>;
  groupes: Array<{ id: string; acronyme: string; nom: string; chambre: string }>;
  lois: Array<{ id: string; titre: string; titreCourt?: string; statut: string }>;
}

async function construireIndexRecherche(): Promise<IndexRecherche> {
  const cleCache = 'index-recherche';
  const indexCache = obtenirCache<IndexRecherche>(cleCache);
  if (indexCache) return indexCache;

  const [maires, deputes, senateurs, groupes, lois] = await Promise.all([
    prisma.maire.findMany({
      select: { id: true, nom: true, prenom: true, libelleCommune: true, libelleDepartement: true },
      take: 5000, // Limiter pour la performance
    }),
    prisma.depute.findMany({
      where: { mandatEnCours: true },
      select: { id: true, slug: true, nom: true, prenom: true, departement: true, groupe: { select: { acronyme: true } } },
    }),
    prisma.senateur.findMany({
      where: { mandatEnCours: true },
      select: { id: true, nom: true, prenom: true, departement: true, groupe: { select: { acronyme: true } } },
    }),
    prisma.groupePolitique.findMany({
      where: { actif: true },
      select: { id: true, acronyme: true, nom: true, chambre: true },
    }),
    prisma.loi.findMany({
      orderBy: { dateDepot: 'desc' },
      take: 500,
      select: { id: true, titre: true, titreCourt: true, statut: true },
    }),
  ]);

  const index: IndexRecherche = {
    maires: maires.map((m) => ({
      id: m.id,
      nom: m.nom,
      prenom: m.prenom,
      commune: m.libelleCommune,
      departement: m.libelleDepartement,
    })),
    deputes: deputes.map((d) => ({
      id: d.id,
      slug: d.slug,
      nom: d.nom,
      prenom: d.prenom,
      departement: d.departement,
      groupe: d.groupe?.acronyme,
    })),
    senateurs: senateurs.map((s) => ({
      id: s.id,
      nom: s.nom,
      prenom: s.prenom,
      departement: s.departement,
      groupe: s.groupe?.acronyme,
    })),
    groupes: groupes.map((g) => ({
      id: g.id,
      acronyme: g.acronyme,
      nom: g.nom,
      chambre: g.chambre,
    })),
    lois: lois.map((l) => ({
      id: l.id,
      titre: l.titre,
      titreCourt: l.titreCourt || undefined,
      statut: l.statut,
    })),
  };

  definirCache(cleCache, index, 600); // Cache 10 minutes
  return index;
}

export async function rechercheGlobale(req: Request, res: Response): Promise<Response> {
  const params = schemaRecherche.parse(req.query);
  const limite = Math.min(50, parseInt(params.limite || '20', 10));
  const type = params.type || 'tout';

  const index = await construireIndexRecherche();
  const resultats: {
    type: string;
    id: string;
    titre: string;
    sousTitre?: string;
    score: number;
  }[] = [];

  const optionsFuse = {
    includeScore: true,
    threshold: 0.4,
    keys: ['nom', 'prenom', 'commune', 'departement', 'acronyme', 'titre', 'titreCourt'],
  };

  // Recherche dans chaque catégorie
  if (type === 'tout' || type === 'deputes') {
    const fuse = new Fuse(index.deputes, optionsFuse);
    const resultatsDeputes = fuse.search(params.q, { limit: limite });
    resultats.push(
      ...resultatsDeputes.map((r) => ({
        type: 'depute',
        id: r.item.id,
        titre: `${r.item.prenom} ${r.item.nom}`,
        sousTitre: `Député · ${r.item.departement}${r.item.groupe ? ` · ${r.item.groupe}` : ''}`,
        score: r.score || 1,
      }))
    );
  }

  if (type === 'tout' || type === 'senateurs') {
    const fuse = new Fuse(index.senateurs, optionsFuse);
    const resultatsSenateurs = fuse.search(params.q, { limit: limite });
    resultats.push(
      ...resultatsSenateurs.map((r) => ({
        type: 'senateur',
        id: r.item.id,
        titre: `${r.item.prenom} ${r.item.nom}`,
        sousTitre: `Sénateur · ${r.item.departement}${r.item.groupe ? ` · ${r.item.groupe}` : ''}`,
        score: r.score || 1,
      }))
    );
  }

  if (type === 'tout' || type === 'maires') {
    const fuse = new Fuse(index.maires, optionsFuse);
    const resultatsMaires = fuse.search(params.q, { limit: limite });
    resultats.push(
      ...resultatsMaires.map((r) => ({
        type: 'maire',
        id: r.item.id,
        titre: `${r.item.prenom} ${r.item.nom}`,
        sousTitre: `Maire de ${r.item.commune} · ${r.item.departement}`,
        score: r.score || 1,
      }))
    );
  }

  if (type === 'tout' || type === 'groupes') {
    const fuse = new Fuse(index.groupes, { ...optionsFuse, keys: ['acronyme', 'nom'] });
    const resultatsGroupes = fuse.search(params.q, { limit: limite });
    resultats.push(
      ...resultatsGroupes.map((r) => ({
        type: 'groupe',
        id: r.item.id,
        titre: `${r.item.acronyme} - ${r.item.nom}`,
        sousTitre: r.item.chambre === 'ASSEMBLEE' ? 'Assemblée nationale' : 'Sénat',
        score: r.score || 1,
      }))
    );
  }

  if (type === 'tout' || type === 'lois') {
    const fuse = new Fuse(index.lois, { ...optionsFuse, keys: ['titre', 'titreCourt'] });
    const resultatsLois = fuse.search(params.q, { limit: limite });
    resultats.push(
      ...resultatsLois.map((r) => ({
        type: 'loi',
        id: r.item.id,
        titre: r.item.titreCourt || r.item.titre,
        sousTitre: `Loi · ${r.item.statut}`,
        score: r.score || 1,
      }))
    );
  }

  // Trier par score et limiter
  resultats.sort((a, b) => a.score - b.score);
  const resultatsFinaux = resultats.slice(0, limite);

  return reponseSucces(res, {
    requete: params.q,
    nombreResultats: resultatsFinaux.length,
    resultats: resultatsFinaux,
  });
}

export async function autocomplete(req: Request, res: Response): Promise<Response> {
  const q = z.string().min(2).parse(req.query.q);

  const index = await construireIndexRecherche();
  const suggestions: Array<{ type: string; id: string; texte: string }> = [];

  const optionsFuse = {
    includeScore: true,
    threshold: 0.3,
    keys: ['nom', 'prenom', 'commune', 'acronyme', 'titre'],
  };

  // Recherche rapide dans chaque catégorie
  const fuseDeputes = new Fuse(index.deputes, optionsFuse);
  const fuseGroupes = new Fuse(index.groupes, { ...optionsFuse, keys: ['acronyme', 'nom'] });
  const fuseLois = new Fuse(index.lois, { ...optionsFuse, keys: ['titre', 'titreCourt'] });

  const [resDeputes, resGroupes, resLois] = [
    fuseDeputes.search(q, { limit: 3 }),
    fuseGroupes.search(q, { limit: 2 }),
    fuseLois.search(q, { limit: 2 }),
  ];

  suggestions.push(
    ...resDeputes.map((r) => ({ type: 'depute', id: r.item.id, texte: `${r.item.prenom} ${r.item.nom}` })),
    ...resGroupes.map((r) => ({ type: 'groupe', id: r.item.id, texte: r.item.nom })),
    ...resLois.map((r) => ({ type: 'loi', id: r.item.id, texte: r.item.titreCourt || r.item.titre.slice(0, 60) }))
  );

  return reponseSucces(res, suggestions.slice(0, 8));
}
