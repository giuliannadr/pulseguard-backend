import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private checker: CheckerService,
    private notifications: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledChecks() {
    const monitors = await this.prisma.monitor.findMany({
      where: { isActive: true, NOT: { url: null } },
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
        this.runCheck(monitor, lastCheck?.status ?? null).catch((err) =>
          this.logger.error(`Check failed for ${monitor.url}: ${err.message}`),
        );
      }
    }
  }

  private async runCheck(
    monitor: {
      id: string;
      name: string;
      url: string | null;
      expectedStatus: number;
      expectedText: string | null;
      notificationWebhookUrl: string | null;
      lastStatus: string | null;
    },
    previousStatus: string | null,
  ) {
    if (!monitor.url) return;

    const result = await this.checker.checkUrl(
      monitor.url,
      monitor.expectedStatus,
      monitor.expectedText,
    );

    await this.prisma.check.create({
      data: { monitorId: monitor.id, ...result },
    });

    // Detect status transitions and send notifications
    const prev = previousStatus ?? monitor.lastStatus;
    const curr = result.status;

    if (monitor.notificationWebhookUrl) {
      const wentDown = curr === 'down' && prev !== 'down';
      const recovered = (curr === 'up' || curr === 'degraded') && prev === 'down';

      if (wentDown) {
        this.notifications.send(
          monitor.notificationWebhookUrl,
          monitor.name,
          monitor.url,
          'down',
          result.errorMessage ?? undefined,
        );
      } else if (recovered) {
        this.notifications.send(
          monitor.notificationWebhookUrl,
          monitor.name,
          monitor.url,
          'up',
        );
      }
    }

    // Persist last known status
    if (prev !== curr) {
      await this.prisma.monitor.update({
        where: { id: monitor.id },
        data: { lastStatus: curr },
      });
    }

    this.logger.log(`[${curr.toUpperCase()}] ${monitor.url} — ${result.responseTimeMs}ms`);
  }
}
