import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notifications/notification.service';
export declare class GithubService {
    private prisma;
    private aiService;
    private notifications;
    private readonly logger;
    private readonly WEBHOOK_URL;
    constructor(prisma: PrismaService, aiService: AiService, notifications: NotificationService);
    getUserRepos(token: string): Promise<any>;
    autoConfigureWebhook(monitorId: string, owner: string, repo: string, token: string, userId: string): Promise<{
        success: boolean;
        webhookId: any;
        webhookConfigured?: undefined;
        repoLinked?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        webhookConfigured: boolean;
        repoLinked: boolean;
        error: string;
        webhookId?: undefined;
    }>;
    scanRepoCommits(monitorId: string, owner: string, repo: string, githubToken: string, force?: boolean): Promise<{
        success: boolean;
        count: number;
    }>;
    handlePushEvent(payload: any): Promise<void>;
}
