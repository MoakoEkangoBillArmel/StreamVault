# 🎬 StreamVault

<div align="center">

![CI](https://github.com/MoakoEkangoBillArmel/StreamVault/actions/workflows/ci.yml/badge.svg?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Node.js](https://img.shields.io/badge/node-%3E%3D22.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-9-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.x-5A67D8)
![tRPC](https://img.shields.io/badge/tRPC-10.x-2596be)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E699)

**Plateforme de streaming d'anime — Backend TypeScript de bout en bout**

</div>

---

## 🏗️ Architecture

StreamVault est un monorepo **Turborepo** organisé en deux applications et un package partagé :

```
streaming-platform/
├── apps/
│   ├── api/          # Backend Next.js (tRPC, Prisma, JWT)
│   └── web/          # Frontend Next.js (à venir)
├── packages/
│   └── shared/       # Types Zod partagés, DTOs, interfaces
└── prisma/           # Schéma PostgreSQL (Neon)
```

### Stack technique

| Couche | Technologie |
|---|---|
| Runtime | Node.js 22 + TypeScript 5 |
| API | tRPC 10 (type-safe de bout en bout) |
| ORM | Prisma 5 |
| Base de données | PostgreSQL via **Neon** (Lakebase) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Recherche | PostgreSQL FTS (`websearch_to_tsquery`) |
| Validation | Zod (schémas partagés) |
| Monorepo | Turborepo + pnpm workspaces |

---

## 🔌 API — Procédures tRPC (21 routes)

### Auth (public)
| Route | Description |
|---|---|
| `auth.register` | Inscription (email + password ≥ 12 chars) |
| `auth.login` | Connexion → JWT 7j |
| `auth.me` | Profil utilisateur authentifié |

### Catalogue (public)
| Route | Description |
|---|---|
| `catalog.getById` | Fiche média par ID Prisma |
| `catalog.getByGenre` | Liste paginée par genre |
| `catalog.getEpisodes` | Liste épisodes d'un média |

### Recherche (public)
| Route | Description |
|---|---|
| `search.query` | Recherche FTS + filtres (type, statut, genre, année, tri) |

### Découverte (public)
| Route | Description |
|---|---|
| `discovery.trending` | Top 20 tendances par popularité |

### Historique (protégé)
| Route | Description |
|---|---|
| `history.upsertPosition` | Sauvegarde de la position de lecture |
| `history.getEpisode` | Position sauvegardée pour un épisode |

### Watch System (protégé)
| Route | Description |
|---|---|
| `watch.upsertProgress` | Progression globale (statut, dernier épisode vu) |
| `watch.getContinueWatching` | Liste "Continuer à regarder" (N+1 résolu) |

### Favoris / Watchlist (protégé)
| Route | Description |
|---|---|
| `favorites.toggle` | Ajouter / retirer un favori |
| `favorites.list` | Liste des favoris de l'utilisateur |
| `watchlist.toggle` | Ajouter / retirer de la watchlist |
| `watchlist.list` | Liste de la watchlist |

### Métadonnées / Admin (admin)
| Route | Description |
|---|---|
| `metadata.syncFromJikan` | Synchronise un anime depuis **Jikan API** (MAL) |
| `metadata.syncFromAnilist` | Synchronise un anime depuis **AniList GraphQL** |
| `sources.resolve` | Résout les flux vidéo (Provider Registry + Circuit Breaker) |

---

## 🔒 Sécurité

- ✅ **JWT_SECRET** obligatoire au démarrage (crash-fast)
- ✅ **CORS** restreint à `NEXT_PUBLIC_WEB_URL` (pas de wildcard `*` + credentials)
- ✅ **bcrypt** avec salt rounds = 10, password ≥ 12 chars (protection troncature)
- ✅ **Validation Zod** sur toutes les entrées tRPC
- ✅ **FTS sécurisé** avec `websearch_to_tsquery` (DoS-proof)
- ✅ **Logs Prisma** conditionnels (SQL masqué en production)
- ✅ **Transactions** atomiques (`$transaction`) dans `CatalogSyncService`
- ✅ **TypeScript strict** sans `dom` lib dans le backend

---

## 📦 Phase 2 — Fonctionnalités à venir

La **Phase 2** couvre l'export/import des données utilisateur (portabilité RGPD) :

| Feature | Description |
|---|---|
| `data.export` | Export JSON signé (watchlist, favoris, historique, progression) avec checksum SHA-256 |
| `data.import` | Import validé avec détection de conflits et résolution par ID externe |
| Schema versionné | `ExportPayloadSchema` (v1.0.0) déjà défini dans `packages/shared` |

---

## 🚀 Démarrage rapide

```bash
# 1. Cloner
git clone https://github.com/MoakoEkangoBillArmel/StreamVault.git
cd StreamVault

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Renseigner DATABASE_URL et JWT_SECRET dans .env

# 4. Générer le client Prisma
pnpm --filter api exec prisma generate

# 5. Appliquer les migrations
pnpm --filter api exec prisma migrate deploy

# 6. (Optionnel) Configurer la recherche Full-Text
pnpm --filter api run fts:setup

# 7. Lancer le serveur de dev
pnpm --filter api run dev
```

Le serveur API démarre sur **http://localhost:3001**.

---

## 🧪 Tests & Audit

```bash
# Tests unitaires (types partagés Zod)
pnpm --filter @streaming/shared exec vitest run

# Audit E2E fonctionnel complet (nécessite DATABASE_URL + JWT_SECRET dans .env)
pnpm --filter api run e2e-audit
```

---

## 📄 Licence

[MIT](./LICENSE) © 2026 Bill Armel Moako Ekango
