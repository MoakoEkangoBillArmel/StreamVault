import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { UpsertWatchHistoryInput } from '@streaming/shared';

export const historyRouter = router({
  getEpisodeHistory: protectedProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.watchHistory.findUnique({
        where: {
          userId_episodeId: {
            userId: ctx.user.id,
            episodeId: input.episodeId,
          },
        },
      });
    }),

  upsertPosition: protectedProcedure
    .input(UpsertWatchHistoryInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.watchHistory.upsert({
        where: {
          userId_episodeId: {
            userId: ctx.user.id,
            episodeId: input.episodeId,
          },
        },
        update: {
          resumePosition: input.resumePosition,
          ...(input.completed !== undefined && { completed: input.completed }),
          watchedAt: new Date(),
        },
        create: {
          userId: ctx.user.id,
          episodeId: input.episodeId,
          resumePosition: input.resumePosition,
          ...(input.completed !== undefined && { completed: input.completed }),
        },
      });
    }),
});
