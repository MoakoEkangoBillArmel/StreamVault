import { PrismaClient } from '@prisma/client';
import { VideoResolver, NormalizedStream, ProviderComplianceCheck } from '@streaming/shared';
import { ProviderHealthService } from './provider-health.service';
import { sanitizeHeaders } from '../lib/sanitize-headers';

export class ProviderRegistry {
  private resolvers = new Map<string, VideoResolver>();
  private complianceRecords = new Map<string, ProviderComplianceCheck>();

  constructor(
    private prisma: PrismaClient,
    private healthService: ProviderHealthService
  ) {}

  public register(id: string, resolver: VideoResolver, compliance: ProviderComplianceCheck) {
    if (compliance.bypassesDrm || compliance.bypassesCaptcha || compliance.bypassesPaywall) {
      console.warn(`Provider ${id} rejected due to compliance check failure.`);
      return;
    }
    this.resolvers.set(id, resolver);
    this.complianceRecords.set(id, compliance);
  }

  public async resolveAll(episodeId: string, language: string): Promise<NormalizedStream[]> {
    // 1. Get enabled providers from DB
    const dbProviders = await this.prisma.provider.findMany({
      where: { enabled: true },
      include: { health: true },
      orderBy: { priority: 'desc' }
    });

    const activeProviders = dbProviders.filter(p => !p.health?.circuitOpen && this.resolvers.has(p.id));
    
    // 2. Execute resolution concurrently
    const promises = activeProviders.map(async (p) => {
      const resolver = this.resolvers.get(p.id)!;
      const startTime = Date.now();
      try {
        const streams = await resolver.resolve(episodeId, language);
        
        // Ensure no private headers leak
        const safeStreams = streams.map(s => ({
          ...s,
          publicHeaders: sanitizeHeaders(s.publicHeaders)
        }));

        await this.healthService.recordSuccess(p.id, Date.now() - startTime);
        await this.healthService.resetFailures(p.id); // Reset failures on success
        return safeStreams;
      } catch (error: any) {
        await this.healthService.recordFailure(p.id, error.message || 'Resolution failed');
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  }
}
