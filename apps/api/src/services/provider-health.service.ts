import { PrismaClient } from '@prisma/client';

export class ProviderHealthService {
  constructor(private prisma: PrismaClient) {}

  async recordSuccess(providerId: string, latencyMs: number) {
    const health = await this.prisma.providerHealth.findUnique({ where: { providerId } });
    if (!health) return;

    // Moving average for latency
    const newAvg = Math.floor((health.avgLatencyMs * health.successCount + latencyMs) / (health.successCount + 1));

    await this.prisma.providerHealth.update({
      where: { providerId },
      data: {
        successCount: { increment: 1 },
        avgLatencyMs: newAvg,
        lastChecked: new Date(),
        circuitOpen: false // close circuit on success
      }
    });
  }

  async recordFailure(providerId: string, errorMsg: string) {
    const health = await this.prisma.providerHealth.findUnique({ where: { providerId } });
    if (!health) return;

    const newFailureCount = health.failureCount + 1;
    // Circuit breaker logic: if more than 5 consecutive failures, open the circuit
    // (Assuming success resets failureCount, which we should do in recordSuccess)
    const circuitOpen = newFailureCount >= 5;

    await this.prisma.providerHealth.update({
      where: { providerId },
      data: {
        failureCount: newFailureCount,
        lastFailure: new Date(),
        lastFailureMsg: errorMsg,
        lastChecked: new Date(),
        circuitOpen
      }
    });
  }

  async resetFailures(providerId: string) {
    await this.prisma.providerHealth.update({
      where: { providerId },
      data: { failureCount: 0, circuitOpen: false }
    });
  }
}
