import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { GithubService } from '../github/github.service';

@Injectable()
export class MonitorsService {
  constructor(
    private prisma: PrismaService,
    private checker: CheckerService,
    private githubService: GithubService,
  ) {}

  findAll(userId: string) {
    return this.prisma.monitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id, userId },
    });
    if (!monitor) throw new NotFoundException('Monitor not found');
    return monitor;
  }

  create(userId: string, dto: CreateMonitorDto) {
    return this.prisma.monitor.create({
      data: {
        userId,
        name: dto.name,
        url: dto.url ?? null,
        expectedStatus: dto.expectedStatus ?? 200,
        expectedText: dto.expectedText,
        intervalMinutes: dto.intervalMinutes ?? 5,
        notificationWebhookUrl: dto.notificationWebhookUrl ?? null,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateMonitorDto) {
    await this.findOne(id, userId);
    return this.prisma.monitor.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.monitor.delete({ where: { id } });
  }

  async getChecks(id: string, userId: string, limit = 100) {
    await this.findOne(id, userId);
    return this.prisma.check.findMany({
      where: { monitorId: id },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });
  }

  async getMetrics(id: string, userId: string) {
    await this.findOne(id, userId);
    const checks = await this.prisma.check.findMany({
      where: { monitorId: id },
      orderBy: { checkedAt: 'desc' },
      take: 500,
    });

    if (checks.length === 0)
      return { uptime: null, avgResponseMs: null, totalChecks: 0 };

    const upCount = checks.filter((c) => c.status === 'up').length;
    const withResponse = checks.filter((c) => c.responseTimeMs !== null);
    const avgResponseMs =
      withResponse.length > 0
        ? Math.round(
            withResponse.reduce((s, c) => s + c.responseTimeMs!, 0) /
              withResponse.length,
          )
        : null;

    return {
      uptime: Math.round((upCount / checks.length) * 10000) / 100,
      avgResponseMs,
      totalChecks: checks.length,
    };
  }

  async runCheckNow(id: string, userId: string) {
    const monitor = await this.findOne(id, userId);
    if (!monitor.url) {
      throw new Error('This monitor has no URL configured for health checks.');
    }
    const result = await this.checker.checkUrl(
      monitor.url,
      monitor.expectedStatus,
      monitor.expectedText,
    );
    return this.prisma.check.create({
      data: { monitorId: id, ...result },
    });
  }

  async getSecurityIncidents(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.securityIncident.findMany({
      where: { monitorId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async scanRepo(id: string, userId: string, githubToken: string) {
    const monitor = await this.findOne(id, userId);
    if (!monitor.githubRepoUrl) {
      throw new Error('This project is not connected to a GitHub repository.');
    }
    if (!githubToken) {
      throw new Error('GitHub token is required to scan repository.');
    }

    const cleanUrl = monitor.githubRepoUrl.replace('.git', '');
    const parts = cleanUrl.split('/');
    const repoName = parts.pop();
    const owner = parts.pop();

    if (!owner || !repoName) {
      throw new Error('Invalid GitHub repository URL.');
    }

    return this.githubService.scanRepoCommits(id, owner, repoName, githubToken);
  }
}
