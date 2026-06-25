import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
export declare class MonitorsService {
    private prisma;
    private checker;
    constructor(prisma: PrismaService, checker: CheckerService);
    findAll(userId: string): import("@prisma/client").Prisma.PrismaPromise<({
        checks: {
            status: string;
            statusCode: number | null;
            responseTimeMs: number | null;
            sslDaysLeft: number | null;
            errorMessage: string | null;
            id: string;
            checkedAt: Date;
            monitorId: string;
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
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
        checkedAt: Date;
        monitorId: string;
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
        checkedAt: Date;
        monitorId: string;
    }>;
    getSecurityIncidents(id: string, userId: string): Promise<any>;
}
