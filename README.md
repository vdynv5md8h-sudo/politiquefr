# PolitiqueFR

Portail d'information sur la politique française. Accédez aux profils des élus, suivez les votes au Parlement, explorez les lois et restez informé de l'actualité politique.

## Fonctionnalités

- **Profils des élus** : Députés, sénateurs et maires avec statistiques d'activité
- **Groupes politiques** : Composition de l'Assemblée nationale et du Sénat
- **Lois** : Suivi du parcours législatif, votes et amendements
- **Actualités** : Agrégation de flux RSS et affaires judiciaires
- **Recherche globale** : Recherche unifiée avec autocomplétion
- **Cartes interactives** : Visualisation géographique avec Leaflet
- **Mode sombre** : Interface adaptative jour/nuit

## Architecture

```
politiquefr/
├── frontend/     # React + Vite + Tailwind CSS
├── backend/      # Node.js + Express + Prisma + SQLite
├── data/         # Scripts de synchronisation
└── docs/         # Documentation
```

## Technologies

### Frontend
- React 18 avec TypeScript
- Vite pour le build
- Tailwind CSS pour le styling
- React Query pour la gestion des données
- Leaflet pour les cartes
- Recharts pour les graphiques

### Backend
- Node.js avec Express
- Prisma ORM avec SQLite
- JWT pour l'authentification admin
- Rate limiting et cache intégré

### Sources de données
- [data.gouv.fr](https://data.gouv.fr) - Répertoire National des Élus
- [nosdeputes.fr](https://nosdeputes.fr) - Activité des députés
- [data.senat.fr](https://data.senat.fr) - Données du Sénat
- [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr) - Données officielles

## Installation

### Prérequis
- Node.js 20+
- npm 10+

### Installation des dépendances

```bash
# À la racine du projet
npm install

# Générer le client Prisma
cd backend && npx prisma generate
```

### Configuration

1. Copier le fichier d'environnement :
```bash
cp backend/.env.example backend/.env
```

2. Configurer les variables d'environnement dans `backend/.env` :
```env
DATABASE_URL="file:./data/politiquefr.db"
JWT_SECRET="votre-cle-secrete-32-caracteres-minimum"
FRONTEND_URL="http://localhost:5173"
```

### Initialisation de la base de données

```bash
# Créer la base de données et appliquer les migrations
cd backend
npx prisma migrate dev

# Peupler avec les données initiales
npm run db:seed
```

### Lancement

```bash
# Depuis la racine, lancer frontend et backend en parallèle
npm run dev
```

- Frontend : http://localhost:5173
- Backend API : http://localhost:3001/api/v1
- Admin : http://localhost:5173/admin/connexion

### Compte admin par défaut
- Email : `admin@politiquefr.fr`
- Mot de passe : `admin123456`

**⚠️ Changez ce mot de passe en production !**

## Synchronisation des données

```bash
# Synchroniser toutes les données
npm run data:sync

# Synchroniser par type
npm run data:sync:deputes
npm run data:sync:maires
```

## API

### Endpoints publics

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/deputes` | Liste des députés |
| `GET /api/v1/senateurs` | Liste des sénateurs |
| `GET /api/v1/maires` | Liste des maires |
| `GET /api/v1/groupes` | Groupes politiques |
| `GET /api/v1/lois` | Lois et textes |
| `GET /api/v1/recherche` | Recherche globale |

### Endpoints admin (authentification requise)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/connexion` | Connexion |
| `GET /api/v1/admin/actualites` | Modération des actualités |
| `GET /api/v1/admin/sync/statut` | Statut de synchronisation |

## Déploiement

### Frontend (Vercel)
```bash
cd frontend && npm run build
```

### Backend (Render)
```bash
cd backend && npm run build && npm start
```

## Conformité

- **RGPD** : Pas de cookies de traçage, données publiques uniquement
- **Open Data** : Toutes les sources sont citées et libres de réutilisation
- **Accessibilité** : Respect des standards ARIA

## Licence

Ce projet utilise des données publiques françaises.
Code source disponible sous licence MIT.

---

Développé avec les données ouvertes de la République française.
