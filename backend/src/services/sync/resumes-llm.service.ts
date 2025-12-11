/**
 * Service de génération de résumés via Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import { prisma } from '../../config/database';
import { logInfo, logError } from '../../utils/logger';
import { TypeResume } from '@prisma/client';

// ==================== TYPES ====================

interface ResultatGeneration {
  traites: number;
  generes: number;
  erreurs: number;
  tokensUtilises: number;
}

interface OptionsResume {
  typeResume?: TypeResume;
  forceRegenerate?: boolean;
}

// ==================== PROMPTS SYSTEME ====================

const PROMPTS_SYSTEME: Record<TypeResume, string> = {
  COURT: `Tu es un expert en politique française. Résume le texte parlementaire suivant en MAXIMUM 2-3 phrases concises.
Utilise un langage clair et factuel. Ne mentionne pas que tu fais un résumé.`,

  MOYEN: `Tu es un expert en politique française. Résume le texte parlementaire suivant en un paragraphe de 100-150 mots.
Couvre les points essentiels : objectif, mesures principales, et impact attendu. Utilise un langage accessible.`,

  LONG: `Tu es un expert en politique française. Fais un résumé détaillé du texte parlementaire suivant en plusieurs paragraphes.
Structure ta réponse avec :
- Contexte et objectifs
- Principales mesures proposées
- Implications potentielles
Utilise un langage clair et professionnel.`,

  POINTS_CLES: `Tu es un expert en politique française. Extrais les 5-7 points clés du texte parlementaire suivant.
Présente-les sous forme de liste à puces. Chaque point doit être concis (max 20 mots).
Utilise un langage factuel et neutre.`,

  VULGARISE: `Tu es un expert en politique française qui s'adresse au grand public.
Explique le texte parlementaire suivant en termes simples, sans jargon juridique ou technique.
Utilise des exemples concrets si possible. Ton objectif est que n'importe qui puisse comprendre l'essentiel.
Maximum 200 mots.`,
};

// ==================== HELPERS ====================

function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 32);
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logError('ANTHROPIC_API_KEY non configurée');
    return null;
  }
  return new Anthropic({ apiKey });
}

// ==================== GENERATION FUNCTIONS ====================

/**
 * Génère un résumé pour un travail parlementaire spécifique
 */
export async function genererResumeTravaux(
  travauxId: string,
  options: OptionsResume = {}
): Promise<{ resume: string; tokensEntree: number; tokensSortie: number } | null> {
  const typeResume = options.typeResume || 'MOYEN';
  const client = getAnthropicClient();

  if (!client) {
    throw new Error('API Claude non configurée');
  }

  // Récupérer le travail parlementaire
  const travaux = await prisma.travauxParlementaire.findUnique({
    where: { id: travauxId },
  });

  if (!travaux) {
    throw new Error(`Travaux parlementaire non trouvé: ${travauxId}`);
  }

  // Construire le texte source
  const texteSource = [
    travaux.titre,
    travaux.titreOfficiel,
    travaux.exposeSommaire,
  ].filter(Boolean).join('\n\n');

  if (!texteSource || texteSource.length < 50) {
    logInfo(`Texte source trop court pour ${travauxId}`);
    return null;
  }

  const hashSource = computeHash(texteSource);

  // Vérifier si un résumé existe déjà et n'a pas changé
  if (!options.forceRegenerate) {
    const resumeExistant = await prisma.resumeLLM.findUnique({
      where: {
        travauxId_typeResume: {
          travauxId,
          typeResume,
        }
      }
    });

    if (resumeExistant && resumeExistant.hashSource === hashSource) {
      logInfo(`Résumé existant et à jour pour ${travauxId}`);
      return {
        resume: resumeExistant.contenu,
        tokensEntree: resumeExistant.tokensEntree || 0,
        tokensSortie: resumeExistant.tokensSortie || 0,
      };
    }
  }

  // Générer le résumé via Claude
  logInfo(`Génération résumé ${typeResume} pour ${travauxId}...`);

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: PROMPTS_SYSTEME[typeResume],
    messages: [
      {
        role: 'user',
        content: `Voici le texte parlementaire à résumer :\n\n${texteSource}`,
      }
    ],
  });

  const contenu = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  const tokensEntree = message.usage.input_tokens;
  const tokensSortie = message.usage.output_tokens;

  // Sauvegarder le résumé
  await prisma.resumeLLM.upsert({
    where: {
      travauxId_typeResume: {
        travauxId,
        typeResume,
      }
    },
    update: {
      contenu,
      modeleLLM: 'claude-3-5-sonnet',
      tokensEntree,
      tokensSortie,
      hashSource,
      updatedAt: new Date(),
    },
    create: {
      travauxId,
      typeResume,
      contenu,
      modeleLLM: 'claude-3-5-sonnet',
      tokensEntree,
      tokensSortie,
      hashSource,
    }
  });

  return { resume: contenu, tokensEntree, tokensSortie };
}

/**
 * Génère un résumé pour une commission d'enquête
 */
export async function genererResumeCommission(
  commissionId: string,
  options: OptionsResume = {}
): Promise<{ resume: string; tokensEntree: number; tokensSortie: number } | null> {
  const typeResume = options.typeResume || 'MOYEN';
  const client = getAnthropicClient();

  if (!client) {
    throw new Error('API Claude non configurée');
  }

  const commission = await prisma.commissionEnquete.findUnique({
    where: { id: commissionId },
  });

  if (!commission) {
    throw new Error(`Commission d'enquête non trouvée: ${commissionId}`);
  }

  const texteSource = [
    commission.titre,
    commission.sujet,
  ].filter(Boolean).join('\n\n');

  if (!texteSource || texteSource.length < 30) {
    return null;
  }

  const hashSource = computeHash(texteSource);

  if (!options.forceRegenerate) {
    const resumeExistant = await prisma.resumeLLM.findUnique({
      where: {
        commissionEnqueteId_typeResume: {
          commissionEnqueteId: commissionId,
          typeResume,
        }
      }
    });

    if (resumeExistant && resumeExistant.hashSource === hashSource) {
      return {
        resume: resumeExistant.contenu,
        tokensEntree: resumeExistant.tokensEntree || 0,
        tokensSortie: resumeExistant.tokensSortie || 0,
      };
    }
  }

  logInfo(`Génération résumé ${typeResume} pour commission ${commissionId}...`);

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: PROMPTS_SYSTEME[typeResume],
    messages: [
      {
        role: 'user',
        content: `Voici les informations sur la commission d'enquête parlementaire :\n\n${texteSource}`,
      }
    ],
  });

  const contenu = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  const tokensEntree = message.usage.input_tokens;
  const tokensSortie = message.usage.output_tokens;

  await prisma.resumeLLM.upsert({
    where: {
      commissionEnqueteId_typeResume: {
        commissionEnqueteId: commissionId,
        typeResume,
      }
    },
    update: {
      contenu,
      modeleLLM: 'claude-3-5-sonnet',
      tokensEntree,
      tokensSortie,
      hashSource,
      updatedAt: new Date(),
    },
    create: {
      commissionEnqueteId: commissionId,
      typeResume,
      contenu,
      modeleLLM: 'claude-3-5-sonnet',
      tokensEntree,
      tokensSortie,
      hashSource,
    }
  });

  return { resume: contenu, tokensEntree, tokensSortie };
}

/**
 * Génère les résumés en batch pour les travaux sans résumé
 */
export async function genererResumes(
  journalId: string,
  options: { limite?: number; typeResume?: TypeResume } = {}
): Promise<ResultatGeneration> {
  logInfo(`[${journalId}] Démarrage génération batch des résumés...`);

  const limite = options.limite || 50;
  const typeResume = options.typeResume || 'MOYEN';

  let traites = 0, generes = 0, erreurs = 0, tokensUtilises = 0;

  // Activer seulement si configuré
  if (process.env.FEATURE_LLM_RESUMES !== 'true') {
    logInfo(`[${journalId}] Feature LLM_RESUMES désactivée`);
    return { traites, generes, erreurs, tokensUtilises };
  }

  // Trouver les travaux sans résumé du type demandé
  const travauxSansResume = await prisma.travauxParlementaire.findMany({
    where: {
      resumes: {
        none: {
          typeResume,
        }
      },
      // Avoir au moins un titre ou un exposé
      OR: [
        { titre: { not: '' } },
        { exposeSommaire: { not: null } },
      ]
    },
    orderBy: { dateDepot: 'desc' },
    take: limite,
  });

  logInfo(`[${journalId}] ${travauxSansResume.length} travaux à traiter`);

  for (const travaux of travauxSansResume) {
    try {
      traites++;
      const resultat = await genererResumeTravaux(travaux.id, { typeResume });

      if (resultat) {
        generes++;
        tokensUtilises += resultat.tokensEntree + resultat.tokensSortie;
      }

      // Pause pour respecter les rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (e) {
      erreurs++;
      logError(`[${journalId}] Erreur génération résumé ${travaux.id}:`, e);
    }
  }

  logInfo(`[${journalId}] Génération terminée: ${generes} résumés générés, ${tokensUtilises} tokens utilisés`);

  return { traites, generes, erreurs, tokensUtilises };
}
