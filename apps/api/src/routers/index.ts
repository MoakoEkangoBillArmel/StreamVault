import { router } from '../trpc/trpc';
import { authRouter } from './auth';
import { catalogRouter } from './catalog';
import { searchRouter } from './search';
import { discoveryRouter } from './discovery';
import { sourcesRouter } from './sources';
import { favoritesRouter } from './favorites';
import { watchlistRouter } from './watchlist';
import { watchRouter } from './watch';
import { historyRouter } from './history';

export const appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  search: searchRouter,
  discovery: discoveryRouter,
  sources: sourcesRouter,
  favorites: favoritesRouter,
  watchlist: watchlistRouter,
  watch: watchRouter,
  history: historyRouter,
});

export type AppRouter = typeof appRouter;
