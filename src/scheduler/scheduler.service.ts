import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private checker: CheckerService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledChecks() {
    const monitors = await this.prisma.monitor.findMany({
      where: { isActive: true },
    });

    const now = new Date();

    for (const monitor of monitors) {
      const lastCheck = await this.prisma.check.findFirst({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: 'desc' },
      });

      const minutesSinceLast = lastCheck
        ? (now.getTime() - lastCheck.checkedAt.getTime()) / 60_000
        : Infinity;

      if (minutesSinceLast >= monitor.intervalMinutes) {
        this.runCheck(monitor).catch((err) =>
          this.logger.error(`Check failed for ${monitor.url}: ${err.message}`),
        );
      }
    }
  }

  private async runCheck(monitor: {
    id: string;
    url: string;
    expectedStatus: number;
    expectedText: string | null;
  }) {
    const result = await this.checker.checkUrl(
      monitor.url,
      monitor.expectedStatus,
      monitor.expectedText,
    );

    await this.prisma.check.create({
      data: { monitorId: monitor.id, ...result },
    });

    this.logger.log(
      `[${result.status.toUpperCase()}] ${monitor.url} — ${result.responseTimeMs}ms`,
    );
  }
}
