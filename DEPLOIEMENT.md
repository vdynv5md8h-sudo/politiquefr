# Guide de Déploiement PolitiqueFR

Ce guide explique comment déployer PolitiqueFR avec :
- **Frontend** : Vercel (gratuit)
- **Backend** : Render (gratuit avec limitations)

## Prérequis

1. Un compte [GitHub](https://github.com)
2. Un compte [Vercel](https://vercel.com) (connexion avec GitHub)
3. Un compte [Render](https://render.com) (connexion avec GitHub)

---

## Étape 1 : Pousser le code sur GitHub

```bash
# Initialiser git si ce n'est pas fait
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - PolitiqueFR"

# Créer le repo sur GitHub puis lier
git remote add origin https://github.com/VOTRE_USERNAME/politiquefr.git
git branch -M main
git push -u origin main
```

---

## Étape 2 : Déployer le Backend sur Render

### 2.1 Créer le service

1. Aller sur [render.com](https://render.com) et se connecter
2. Cliquer sur **New +** → **Web Service**
3. Connecter votre repo GitHub `politiquefr`
4. Configurer le service :

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `politiquefr-api` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Plan** | `Starter` (gratuit) |

### 2.2 Ajouter un disque persistant (IMPORTANT pour SQLite)

1. Dans le service créé, aller dans **Disks**
2. Cliquer **Add Disk** :
   - **Name** : `politiquefr-data`
   - **Mount Path** : `/opt/render/project/src/prisma/data`
   - **Size** : `1 GB`

### 2.3 Configurer les variables d'environnement

Dans **Environment** → **Environment Variables**, ajouter :

| Clé | Valeur |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `file:/opt/render/project/src/prisma/data/politiquefr.db` |
| `JWT_SECRET` | *(Générer avec `openssl rand -base64 32`)* |
| `FRONTEND_URL` | *(À remplir après déploiement Vercel)* |

### 2.4 Déployer

Cliquer **Create Web Service**. Le premier déploiement prendra quelques minutes.

**URL du backend** : `https://politiquefr-api.onrender.com`

### 2.5 Initialiser la base de données (première fois)

Après le premier déploiement réussi, aller dans l'onglet **Shell** et exécuter :

```bash
npx prisma migrate deploy
npm run db:seed
```

---

## Étape 3 : Déployer le Frontend sur Vercel

### 3.1 Importer le projet

1. Aller sur [vercel.com](https://vercel.com) et se connecter
2. Cliquer **Add New...** → **Project**
3. Importer le repo `politiquefr` depuis GitHub
4. Configurer le projet :

| Paramètre | Valeur |
|-----------|--------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3.2 Configurer les variables d'environnement

Dans **Environment Variables**, ajouter :

| Clé | Valeur |
|-----|--------|
| `VITE_API_URL` | `https://politiquefr-api.onrender.com` |

### 3.3 Déployer

Cliquer **Deploy**. Le déploiement prendra environ 1-2 minutes.

**URL du frontend** : `https://politiquefr.vercel.app`

---

## Étape 4 : Mettre à jour le CORS du backend

Retourner sur Render et mettre à jour la variable `FRONTEND_URL` :

```
FRONTEND_URL=https://politiquefr.vercel.app
```

Redéployer le backend (cliquer **Manual Deploy** → **Deploy latest commit**).

---

## Étape 5 : Vérification

1. Tester le health check : `https://politiquefr-api.onrender.com/health`
2. Tester l'API : `https://politiquefr-api.onrender.com/api/v1/deputes`
3. Accéder au frontend : `https://politiquefr.vercel.app`
4. Tester la connexion admin : `/admin/connexion`
   - Email : `admin@politiquefr.fr`
   - Mot de passe : `admin123456`

⚠️ **IMPORTANT** : Changer le mot de passe admin après le premier déploiement !

---

## Configuration d'un domaine personnalisé (optionnel)

### Vercel (Frontend)

1. Dans le projet Vercel → **Settings** → **Domains**
2. Ajouter votre domaine (ex: `politiquefr.fr`)
3. Configurer les DNS chez votre registrar

### Render (Backend)

1. Dans le service Render → **Settings** → **Custom Domains**
2. Ajouter votre sous-domaine (ex: `api.politiquefr.fr`)
3. Configurer les DNS

Mettre à jour les variables d'environnement avec les nouveaux domaines.

---

## Synchronisation des données

### Manuelle (via Shell Render)

```bash
# Synchroniser les députés
npm run data:sync:deputes

# Synchroniser tous les types
npm run data:sync
```

### Automatique avec CRON

Render propose des CRON jobs payants. Alternative gratuite : GitHub Actions.

Créer `.github/workflows/sync-data.yml` :

```yaml
name: Sync Data

on:
  schedule:
    # Tous les jours à 3h du matin
    - cron: '0 3 * * *'
  workflow_dispatch: # Permet le déclenchement manuel

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST "https://politiquefr-api.onrender.com/api/v1/admin/sync/trigger" \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
            -H "Content-Type: application/json"
```

---

## Dépannage

### Le backend ne démarre pas

1. Vérifier les logs dans Render → **Logs**
2. S'assurer que `DATABASE_URL` pointe vers le disque monté
3. Vérifier que les migrations ont été exécutées

### Erreurs CORS

1. Vérifier que `FRONTEND_URL` est correct (sans slash final)
2. Redéployer le backend après modification

### Base de données vide

1. Aller dans Shell Render
2. Exécuter `npm run db:seed`

### Le frontend ne charge pas les données

1. Vérifier la console du navigateur (F12)
2. S'assurer que `VITE_API_URL` est correct
3. Tester l'API directement dans le navigateur

---

## Coûts estimés

| Service | Plan | Coût |
|---------|------|------|
| Vercel | Hobby | Gratuit |
| Render | Starter | Gratuit* |
| **Total** | | **Gratuit** |

*Le plan gratuit Render met le service en veille après 15 min d'inactivité. Premier accès après veille = ~30s de latence.

### Upgrade recommandé pour la production

- **Render Starter Plus** ($7/mois) : Pas de mise en veille
- **Vercel Pro** ($20/mois) : Analytics, plus de bande passante

---

## Sécurité en production

1. ✅ Changer le mot de passe admin
2. ✅ Utiliser un JWT_SECRET fort (32+ caractères)
3. ✅ Activer HTTPS (automatique sur Vercel/Render)
4. ✅ Limiter les origines CORS à votre domaine
5. ⚠️ Envisager une base PostgreSQL pour la production à grande échelle

---

## Support

- Documentation Vercel : https://vercel.com/docs
- Documentation Render : https://render.com/docs
- Issues projet : https://github.com/VOTRE_USERNAME/politiquefr/issues
