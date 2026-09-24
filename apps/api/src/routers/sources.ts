import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { ProviderRegistry } from '../services/provider-registry.service';
import { ProviderHealthService } from '../services/provider-health.service';

export const sourcesRouter = router({
  resolve: protectedProcedure
    .input(z.object({
      episodeId: z.string(),
      language: z.enum(['VF', 'VOSTFR', 'RAW']).default('VOSTFR')
    }))
    .query(async ({ ctx, input }) => {
      const healthService = new ProviderHealthService(ctx.prisma);
      const registry = new ProviderRegistry(ctx.prisma, healthService);
      
      // In a real scenario, providers would be registered during bootstrap.
      // E.g., registry.register('my_provider', myResolver, complianceCheck);
      
      const streams = await registry.resolveAll(input.episodeId, input.language);
      return streams;
    }),
});
