import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
export declare class MonitorsController {
    private readonly service;
    constructor(service: MonitorsService);
    findAll(req: any): import("@prisma/client").Prisma.PrismaPromise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateMonitorDto, req: any): import("@prisma/client").Prisma.Prisma__MonitorClient<{
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
    update(id: string, dto: UpdateMonitorDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
    getChecks(id: string, limit: string, req: any): Promise<{
        status: string;
        statusCode: number | null;
        responseTimeMs: number | null;
        sslDaysLeft: number | null;
        errorMessage: string | null;
        id: string;
        checkedAt: Date;
        monitorId: string;
    }[]>;
    getMetrics(id: string, req: any): Promise<{
        uptime: null;
        avgResponseMs: null;
        totalChecks: number;
    } | {
        uptime: number;
        avgResponseMs: number | null;
        totalChecks: number;
    }>;
    runCheckNow(id: string, req: any): Promise<{
        status: string;
        statusCode: number | null;
        responseTimeMs: number | null;
        sslDaysLeft: number | null;
        errorMessage: string | null;
        id: string;
        checkedAt: Date;
        monitorId: string;
    }>;
    getSecurityIncidents(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        monitorId: string;
        commitHash: string;
        commitAuthor: string | null;
        riskType: string;
        severity: string;
        description: string;
        recommendation: string;
        resolved: boolean;
    }[]>;
}
