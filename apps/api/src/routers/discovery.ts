import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { DiscoveryService } from '../services/discovery.service';

const discoveryService = new DiscoveryService();

export const discoveryRouter = router({
  trending: publicProcedure
    .input(z.object({ page: z.number().default(1) }).optional())
    .query(async ({ input }) => {
      return discoveryService.getTrending(input?.page);
    }),

  popular: publicProcedure
    .input(z.object({ page: z.number().default(1) }).optional())
    .query(async ({ input }) => {
      return discoveryService.getPopular(input?.page);
    }),

  seasonal: publicProcedure
    .input(z.object({ year: z.number(), quarter: z.string(), page: z.number().default(1) }))
    .query(async ({ input }) => {
      return discoveryService.getSeasonal(input.year, input.quarter, input.page);
    }),

  similar: publicProcedure
    .input(z.object({ mediaId: z.string() }))
    .query(async ({ input }) => {
      return discoveryService.getSimilar(input.mediaId);
    }),

  recentlyAdded: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { genres: { include: { genre: true } } },
      });
    }),
});
