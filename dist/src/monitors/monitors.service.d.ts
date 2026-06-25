import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { GithubService } from '../github/github.service';
export declare class MonitorsService {
    private prisma;
    private checker;
    private githubService;
    constructor(prisma: PrismaService, checker: CheckerService, githubService: GithubService);
    findAll(userId: string): import("@prisma/client").Prisma.PrismaPromise<({
        checks: {
            status: string;
            statusCode: number | null;
            responseTimeMs: number | null;
            sslDaysLeft: number | null;
            errorMessage: string | null;
            id: string;
            monitorId: string;
            checkedAt: Date;
        }[];
    } & {
        url: string;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        url: string;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(userId: string, dto: CreateMonitorDto): import("@prisma/client").Prisma.Prisma__MonitorClient<{
        url: string;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, {
        adapter: import("@prisma/adapter-pg").PrismaPg;
    }>;
    update(id: string, userId: string, dto: UpdateMonitorDto): Promise<{
        url: string;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, userId: string): Promise<{
        url: string;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getChecks(id: string, userId: string, limit?: number): Promise<{
        status: string;
        statusCode: number | null;
        responseTimeMs: number | null;
        sslDaysLeft: number | null;
        errorMessage: string | null;
        id: string;
        monitorId: string;
        checkedAt: Date;
    }[]>;
    getMetrics(id: string, userId: string): Promise<{
        uptime: null;
        avgResponseMs: null;
        totalChecks: number;
    } | {
        uptime: number;
        avgResponseMs: number | null;
        totalChecks: number;
    }>;
    runCheckNow(id: string, userId: string): Promise<{
        status: string;
        statusCode: number | null;
        responseTimeMs: number | null;
        sslDaysLeft: number | null;
        errorMessage: string | null;
        id: string;
        monitorId: string;
        checkedAt: Date;
    }>;
    getSecurityIncidents(id: string, userId: string): Promise<{
        riskType: string;
        severity: string;
        description: string;
        recommendation: string;
        id: string;
        createdAt: Date;
        monitorId: string;
        commitHash: string;
        commitAuthor: string | null;
        resolved: boolean;
    }[]>;
    scanRepo(id: string, userId: string, githubToken: string): Promise<{
        success: boolean;
        count: number;
    }>;
}
