import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { ProviderRegistry } from '../services/provider-registry.service';
import { ProviderHealthService } from '../services/provider-health.service';
import { TestDemoProvider } from '../services/providers/test-demo-provider';

export const sourcesRouter = router({
  resolve: protectedProcedure
    .input(z.object({
      episodeId: z.string(),
      language: z.enum(['VF', 'VOSTFR', 'RAW']).default('VOSTFR')
    }))
    .query(async ({ ctx, input }) => {
      const healthService = new ProviderHealthService(ctx.prisma);
      const registry = new ProviderRegistry(ctx.prisma, healthService);
      
      // Enregistrement du provider de test
      registry.register('test_demo_provider', new TestDemoProvider(), {
        providerId: 'test_demo_provider',
        hasOfficialApi: false, // It's just a test API
        tosUrl: 'https://test-streams.mux.dev',
        robotsTxtCompliant: true,
        requiresAuth: false,
        bypassesDrm: false,
        bypassesCaptcha: false,
        bypassesPaywall: false,
        lastVerified: new Date(),
        verifiedBy: 'system'
      });

      
      const streams = await registry.resolveAll(input.episodeId, input.language);
      return streams;
    }),
});
