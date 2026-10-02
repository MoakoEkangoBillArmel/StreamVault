import { PrismaClient } from '@prisma/client';

export class ProviderHealthService {
  constructor(private prisma: PrismaClient) {}

  async recordSuccess(providerId: string, latencyMs: number) {
    const health = await this.prisma.providerHealth.findUnique({ where: { providerId } });
    const successCount = (health?.successCount || 0) + 1;
    const currentAvg = health?.avgLatencyMs || 0;
    const newAvg = Math.floor((currentAvg * (health?.successCount || 0) + latencyMs) / successCount);

    await this.prisma.providerHealth.upsert({
      where: { providerId },
      create: {
        providerId,
        successCount: 1,
        failureCount: 0,
        avgLatencyMs: latencyMs,
        lastChecked: new Date(),
        circuitOpen: false,
      },
      update: {
        successCount: { increment: 1 },
        failureCount: 0,
        avgLatencyMs: newAvg,
        lastChecked: new Date(),
        circuitOpen: false,
      },
    });
  }

  async recordFailure(providerId: string, errorMsg: string) {
    const health = await this.prisma.providerHealth.findUnique({ where: { providerId } });
    const newFailureCount = (health?.failureCount || 0) + 1;
    const circuitOpen = newFailureCount >= 5;

    await this.prisma.providerHealth.upsert({
      where: { providerId },
      create: {
        providerId,
        successCount: 0,
        failureCount: 1,
        avgLatencyMs: 0,
        lastFailure: new Date(),
        lastFailureMsg: errorMsg,
        lastChecked: new Date(),
        circuitOpen: false,
      },
      update: {
        failureCount: newFailureCount,
        lastFailure: new Date(),
        lastFailureMsg: errorMsg,
        lastChecked: new Date(),
        circuitOpen,
      },
    });
  }

  async resetFailures(providerId: string) {
    try {
      await this.prisma.providerHealth.update({
        where: { providerId },
        data: { failureCount: 0, circuitOpen: false },
      });
    } catch {
      // Ignore if providerHealth record not found
    }
  }
}
