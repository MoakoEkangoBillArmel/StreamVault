# 🤝 Guide de Contribution — StreamVault

Merci de l'intérêt que vous portez à StreamVault ! Ce guide vous explique comment contribuer efficacement au projet.

## 📋 Prérequis

- **Node.js** ≥ 22.0
- **pnpm** ≥ 9
- Un compte **Neon** avec une base de données PostgreSQL

## 🚀 Démarrage

```bash
# 1. Forker et cloner le dépôt
git clone https://github.com/<votre-username>/StreamVault.git
cd StreamVault

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Renseigner DATABASE_URL et JWT_SECRET

# 4. Générer le client Prisma
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate dev
```

## 🌿 Workflow Git

Nous suivons le modèle **Trunk-Based Development** :

| Type de branche | Convention | Exemple |
|---|---|---|
| Feature | `feat/<description>` | `feat/user-notifications` |
| Bug fix | `fix/<description>` | `fix/search-crash` |
| Documentation | `docs/<description>` | `docs/api-reference` |
| Refactoring | `refactor/<description>` | `refactor/catalog-service` |

### Étapes

1. **Créer une branche** depuis `main`
2. **Développer** avec des commits atomiques
3. **Ouvrir une PR** avec description et contexte
4. **CI verte** obligatoire avant merge
5. **Squash merge** uniquement

## ✅ Standards de code

- **TypeScript strict** — pas de `any` non justifié
- **Zod** pour toute validation d'entrée
- **tRPC** pour toutes les routes API (pas de REST ad hoc)
- Tests unitaires pour les fonctions de `packages/shared`

## 🧪 Lancer les tests

```bash
# Tests unitaires
pnpm --filter @streaming/shared exec vitest run

# Audit E2E
pnpm --filter api run e2e-audit
```

## 📝 Convention de commits

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: add episode progress sync
fix: prevent duplicate genre creation
docs: update API reference
refactor: optimize search N+1 query
test: add watchlist toggle coverage
ci: add security audit step
```

## 🐛 Signaler un bug

Ouvrez une [issue GitHub](https://github.com/MoakoEkangoBillArmel/StreamVault/issues) avec :
- La description précise du problème
- Les étapes pour le reproduire
- Le comportement attendu vs observé
- Les logs pertinents (sans données sensibles)

## 💡 Proposer une fonctionnalité

Ouvrez une issue avec le label `enhancement` et décrivez :
- Le cas d'usage concret
- L'impact sur l'architecture existante
- Une proposition d'implémentation (optionnel)

---

*Merci de contribuer à StreamVault ! 🎬*
