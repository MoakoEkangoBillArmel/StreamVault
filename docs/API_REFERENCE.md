# 🔑 API Reference — StreamVault

Documentation technique complète de l'API tRPC StreamVault.

## Base URL

```
http://localhost:3001/api/trpc
```

## Authentification

L'API utilise des **JWT Bearer tokens** retournés par `auth.login` ou `auth.register`.

Ajouter dans les headers :
```
Authorization: Bearer <token>
```

---

## 🔐 auth.*

### `auth.register` — `mutation`
**Public** — Crée un nouveau compte utilisateur.

```ts
input: {
  email: string   // email valide
  password: string // min 12, max 200 chars
  name?: string
}

output: {
  token: string   // JWT 7 jours
  user: { id, email, name, role }
}
```

### `auth.login` — `mutation`
**Public** — Authentifie un utilisateur existant.

```ts
input: { email: string, password: string }
output: { token: string, user: { id, email, name, role } }
```

### `auth.me` — `query`
**Protégé** — Retourne le profil de l'utilisateur connecté.

```ts
output: { id, email, name, role }
```

---

## 📚 catalog.*

### `catalog.getById` — `query`
**Public** — Récupère un média par son ID Prisma.

```ts
input: { id: string }
output: Media & { genres: Genre[], episodes: Episode[] }
```

### `catalog.getByGenre` — `query`
**Public** — Liste paginée des médias d'un genre.

```ts
input: { genre: string, page?: number, limit?: number }
output: (Media & { genres: Genre[] })[]
```

### `catalog.getEpisodes` — `query`
**Public** — Liste les épisodes d'un média.

```ts
input: { mediaId: string }
output: Episode[]
```

---

## 🔍 search.*

### `search.query` — `query`
**Public** — Recherche Full-Text PostgreSQL avec filtres.

```ts
input: {
  q?: string
  type?: 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC'
  status?: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | 'UNKNOWN'
  genre?: string
  seasonYear?: number
  seasonQuarter?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'
  sortBy?: 'title' | 'score' | 'popularity' | 'startDate'
  sortOrder?: 'asc' | 'desc'
  page?: number   // défaut: 1
  limit?: number  // défaut: 20, max: 50
}

output: {
  items: Media[]
  meta: { total: number, page: number, limit: number, totalPages: number }
}
```

---

## 🔥 discovery.*

### `discovery.trending` — `query`
**Public** — Top 20 médias tendance par popularité.

```ts
input: { page?: number }
output: Media[]
```

---

## 📺 watch.*

### `watch.upsertProgress` — `mutation`
**Protégé** — Met à jour la progression globale d'un utilisateur sur un média.

```ts
input: {
  mediaId: string
  status: 'PLAN_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'
  lastWatchedEpNum?: number
}
output: WatchProgress
```

### `watch.getContinueWatching` — `query`
**Protégé** — Liste "Continuer à regarder" (algo N+1 optimisé).

```ts
output: { media: Media, episode: Episode, resumePosition: number }[]
```

---

## 📊 history.*

### `history.upsertPosition` — `mutation`
**Protégé** — Sauvegarde la position de lecture d'un épisode.

```ts
input: {
  episodeId: string
  resumePosition: number // en secondes, min: 0
  completed?: boolean
}
output: WatchHistory
```

---

## ❤️ favorites.* / watchlist.*

### `favorites.toggle` / `watchlist.toggle` — `mutation`
**Protégé** — Ajoute ou retire un média des favoris/watchlist (toggle).

```ts
input: { mediaId: string }
output: { added: boolean }
```

### `favorites.list` / `watchlist.list` — `query`
**Protégé** — Liste les favoris/watchlist de l'utilisateur.

```ts
output: (Favorite | WatchlistItem) & { media: Media }[]
```

---

## 📡 sources.*

### `sources.resolve` — `query`
**Protégé** — Résout les flux vidéo pour un épisode via le Provider Registry.

```ts
input: { episodeId: string, language: string }
output: { url: string, quality: string, language: string, provider: string }[]
```

---

## 🔄 metadata.* *(Admin)*

### `metadata.syncFromJikan` — `mutation`
**Admin** — Synchronise un anime depuis l'API Jikan (MyAnimeList).

```ts
input: { malId: string }
output: Media
```

### `metadata.syncFromAnilist` — `mutation`
**Admin** — Synchronise un anime depuis l'API AniList GraphQL.

```ts
input: { anilistId: string }
output: Media
```
