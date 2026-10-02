import { router, protectedProcedure } from '../trpc/trpc';
import { ToggleMediaInput } from '@streaming/shared';
import { TRPCError } from '@trpc/server';

export const favoritesRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.favorite.findMany({
        where: { userId: ctx.user.id },
        include: { media: true },
        orderBy: { createdAt: 'desc' },
      });
    }),

  toggle: protectedProcedure
    .input(ToggleMediaInput)
    .mutation(async ({ ctx, input }) => {
      const mediaExists = await ctx.prisma.media.findUnique({ where: { id: input.mediaId } });
      if (!mediaExists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Media not found' });
      }
      const existing = await ctx.prisma.favorite.findUnique({
        where: {
          userId_mediaId: {
            userId: ctx.user.id,
            mediaId: input.mediaId,
          },
        },
      });

      if (existing) {
        await ctx.prisma.favorite.delete({
          where: { id: existing.id },
        });
        return { added: false };
      } else {
        try {
          await ctx.prisma.favorite.create({
            data: {
              userId: ctx.user.id,
              mediaId: input.mediaId,
            },
          });
          return { added: true };
        } catch (err: any) {
          if (err.code === 'P2002') {
            return { added: true };
          }
          throw err;
        }
      }
    }),
});
