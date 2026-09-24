import { router, publicProcedure } from '../trpc/trpc';
import { SearchQueryInput } from '@streaming/shared';
import { SearchService } from '../services/search.service';

export const searchRouter = router({
  query: publicProcedure
    .input(SearchQueryInput)
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.prisma);
      return searchService.search(input);
    }),
});
