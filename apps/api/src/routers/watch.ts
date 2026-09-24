import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { UpdateWatchProgressInput } from '@streaming/shared';

export const watchRouter = router({
  getProgress: protectedProcedure
    .input(z.object({ mediaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.watchProgress.findUnique({
        where: {
          userId_mediaId: {
            userId: ctx.user.id,
            mediaId: input.mediaId,
          },
        },
      });
    }),

  updateProgress: protectedProcedure
    .input(UpdateWatchProgressInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.watchProgress.upsert({
        where: {
          userId_mediaId: {
            userId: ctx.user.id,
            mediaId: input.mediaId,
          },
        },
        update: {
          status: input.status,
          ...(input.lastWatchedEpNum !== undefined && { lastWatchedEpNum: input.lastWatchedEpNum }),
        },
        create: {
          userId: ctx.user.id,
          mediaId: input.mediaId,
          status: input.status,
          ...(input.lastWatchedEpNum !== undefined && { lastWatchedEpNum: input.lastWatchedEpNum }),
        },
      });
    }),

  getContinueWatching: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all "WATCHING" progress for the user
      const progress = await ctx.prisma.watchProgress.findMany({
        where: {
          userId: ctx.user.id,
          status: 'WATCHING',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          media: {
            include: { episodes: true }
          }
        },
      });

      const continueWatching = [];

      for (const p of progress) {
        if (!p.lastWatchedEpNum) continue;

        // Find the specific episode they were last watching
        const lastEpisode = p.media.episodes.find(e => e.number === p.lastWatchedEpNum);
        if (!lastEpisode) continue;

        // Fetch history for this episode
        const history = await ctx.prisma.watchHistory.findUnique({
          where: {
            userId_episodeId: {
              userId: ctx.user.id,
              episodeId: lastEpisode.id,
            }
          }
        });

        if (!history) continue;

        if (history.completed) {
          // If completed, suggest the NEXT episode
          const nextEpisode = p.media.episodes.find(e => e.number === p.lastWatchedEpNum! + 1);
          if (nextEpisode) {
            continueWatching.push({
              media: p.media,
              episode: nextEpisode,
              resumePosition: 0,
            });
          }
        } else {
          // If not completed, suggest resuming the current episode
          continueWatching.push({
            media: p.media,
            episode: lastEpisode,
            resumePosition: history.resumePosition,
          });
        }
      }

      return continueWatching;
    }),
});
