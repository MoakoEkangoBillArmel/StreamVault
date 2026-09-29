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

## 🔄 Phase 2 — Portabilité des données (En cours)

- [ ] `data.export` — Export JSON signé avec checksum SHA-256
- [ ] `data.import` — Import avec détection de conflits par ID externe
- [ ] Schema versionné `ExportPayloadSchema` v1.0.0 (déjà défini)
- [ ] Rate limiting sur les routes sensibles

## 🚀 Phase 3 — Frontend

- [ ] Interface Next.js avec tRPC client type-safe
- [ ] Player vidéo HLS (hls.js)
- [ ] Page catalogue avec filtres avancés
- [ ] Page profil utilisateur
- [ ] Tableau de bord "Continuer à regarder"

## 🌐 Phase 4 — Infrastructure

- [ ] Déploiement Vercel (API) + Neon (DB)
- [ ] CDN pour les assets statiques
- [ ] Monitoring et alertes (Sentry)
- [ ] Analytics de visionnage
- [ ] Syst�me de r�compenses et badges utilisateurs
