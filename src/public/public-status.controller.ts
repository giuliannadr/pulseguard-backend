import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicStatusController {
  constructor(private prisma: PrismaService) {}

  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    const monitors = await this.prisma.monitor.findMany({
      where: { userId, isActive: true },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 90 },
      },
      orderBy: { createdAt: 'asc' },
    });

    return monitors.map((m) => {
      const lastCheck = m.checks[0] ?? null;
      const upCount = m.checks.filter((c) => c.status === 'up').length;
      const uptime =
        m.checks.length > 0
          ? Math.round((upCount / m.checks.length) * 10000) / 100
          : null;
      return {
        id: m.id,
        name: m.name,
        status: lastCheck?.status ?? 'unknown',
        uptime,
        responseTimeMs: lastCheck?.responseTimeMs ?? null,
        checks: m.checks.map((c) => ({
          status: c.status,
          checkedAt: c.checkedAt,
        })),
      };
    });
  }
}
