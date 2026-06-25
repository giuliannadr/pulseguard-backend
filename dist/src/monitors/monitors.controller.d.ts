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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, {
        adapter: import("@prisma/adapter-pg").PrismaPg;
    }>;
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
        monitorId: string;
        checkedAt: Date;
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
        monitorId: string;
        checkedAt: Date;
    }>;
    getSecurityIncidents(id: string, req: any): Promise<{
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
    scanRepo(id: string, req: any, githubToken: string): Promise<{
        success: boolean;
        count: number;
    }>;
}
