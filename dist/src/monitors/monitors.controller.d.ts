import { MonitorsService } from './monitors.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
export declare class MonitorsController {
    private readonly service;
    private readonly notifications;
    constructor(service: MonitorsService, notifications: NotificationService);
    findAll(req: any): import("@prisma/client").Prisma.PrismaPromise<({
        checks: {
            status: string;
            statusCode: number | null;
            responseTimeMs: number | null;
            sslDaysLeft: number | null;
            errorMessage: string | null;
            securityGrade: string | null;
            securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            monitorId: string;
            checkedAt: Date;
        }[];
    } & {
        url: string | null;
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        maintenanceWindows: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        lastStatus: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, req: any): Promise<{
        url: string | null;
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        maintenanceWindows: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        lastStatus: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateMonitorDto, req: any): import("@prisma/client").Prisma.Prisma__MonitorClient<{
        url: string | null;
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        maintenanceWindows: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        lastStatus: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, {
        adapter: import("@prisma/adapter-pg").PrismaPg;
    }>;
    update(id: string, dto: UpdateMonitorDto, req: any): Promise<{
        url: string | null;
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        maintenanceWindows: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        lastStatus: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        url: string | null;
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
        name: string;
        expectedStatus: number;
        expectedText: string | null;
        intervalMinutes: number;
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        maintenanceWindows: import("@prisma/client/runtime/client").JsonValue | null;
        isActive: boolean;
        id: string;
        userId: string;
        githubRepoUrl: string | null;
        githubWebhookId: string | null;
        lastStatus: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getChecks(id: string, limit: string, req: any): Promise<{
        status: string;
        statusCode: number | null;
        responseTimeMs: number | null;
        sslDaysLeft: number | null;
        errorMessage: string | null;
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
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
        securityGrade: string | null;
        securityHeaders: import("@prisma/client/runtime/client").JsonValue | null;
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
    getDowntimeHistory(id: string, req: any): Promise<{
        start: Date;
        end: Date | null;
        durationMs: number;
    }[]>;
    testEmail(id: string, req: any): Promise<{
        ok: boolean;
        message: string;
    }>;
    scanRepo(id: string, req: any, githubToken: string, force?: string): Promise<{
        success: boolean;
        count: number;
    }>;
}
