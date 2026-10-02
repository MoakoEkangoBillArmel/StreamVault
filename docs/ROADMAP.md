# 🗺️ Feuille de Route — StreamVault

Ce document décrit la roadmap technique et les fonctionnalités planifiées.

## ✅ Phase 1 — Backend fondationnel (Complété)

- [x] Architecture Turborepo + pnpm workspaces
- [x] API tRPC type-safe de bout en bout (21 procédures)
- [x] Authentification JWT + bcrypt (password ≥ 12 chars)
- [x] ORM Prisma + PostgreSQL (Neon)
- [x] Recherche Full-Text (`websearch_to_tsquery`)
- [x] Système de Watch / Historique / Favoris / Watchlist
- [x] Provider Registry + Circuit Breaker pour les flux vidéo
- [x] Intégration Jikan API (MyAnimeList) et AniList GraphQL
- [x] Normalisation des métadonnées (Jikan ↔ AniList → CanonicalMedia)
- [x] Audit E2E automatisé (37 tests unitaires, 16 tests d'intégration)
- [x] Pipeline CI GitHub Actions (Unit Tests, Security, Lint, Build)
- [x] Sécurité production (CORS, logs conditionnels, JWT crash-fast)

## 🔄 Phase 2 — Portabilité des données (Complété)

- [x] `data.export` — Export JSON signé avec checksum SHA-256
- [x] `data.import` — Import transactionnel avec détection de conflits et déduplication
- [x] `data.previewImport` — Aperçu détaillé des imports avant persistance
- [x] Schéma versionné `DataExportPayloadSchema` v1 (Zod strict avec bornes DoS)
- [x] Rate limiting et protection contre les attaques par force brute

## 🚀 Phase 3 — Frontend

- [ ] Interface Next.js avec tRPC client type-safe
- [ ] Player vidéo HLS (hls.js) réactif avec reprise de lecture
- [ ] Page catalogue avec recherche temps réel et filtres avancés
- [ ] Page profil utilisateur et gestion des listes
- [ ] Tableau de bord "Continuer à regarder"
- [ ] Système de récompenses et badges utilisateurs (Frontend)

## 🌐 Phase 4 — Infrastructure

- [ ] Déploiement Vercel (API & Web) + Neon (DB)
- [ ] CDN pour les assets statiques
- [ ] Monitoring et alertes (Sentry)
- [ ] Analytics de visionnage
