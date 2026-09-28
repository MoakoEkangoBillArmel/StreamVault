# Security Policy — StreamVault

## Versions supportées

| Version | Support sécurité |
|---|---|
| 0.1.x (main) | ✅ Actif |

## Signalement d'une vulnérabilité

**Ne créez pas d'issue publique pour signaler une vulnérabilité.**

Envoyez un email à : **armel.moako@facsciences-uy1.cm**

Veuillez inclure :
- Description détaillée de la vulnérabilité
- Étapes de reproduction
- Impact potentiel estimé
- Votre recommandation de correction (optionnel)

Nous nous engageons à :
- Accuser réception dans les **48h**
- Proposer un correctif sous **7 jours** pour les critiques
- Vous mentionner dans le CHANGELOG si vous le souhaitez

## Pratiques de sécurité

- Toutes les dépendances sont auditées via `pnpm audit` à chaque CI
- Les tokens et secrets ne sont jamais committés (voir `.gitignore` et `.env.example`)
- Les mots de passe sont hashés avec `bcrypt` (salt rounds = 10, min 12 chars)
- `JWT_SECRET` est obligatoire au démarrage (crash-fast)
- La validation Zod est appliquée sur toutes les entrées API
