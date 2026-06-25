import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
export declare class GithubService {
    private prisma;
    private aiService;
    private readonly logger;
    private readonly WEBHOOK_URL;
    constructor(prisma: PrismaService, aiService: AiService);
    getUserRepos(token: string): Promise<any>;
    autoConfigureWebhook(monitorId: string, owner: string, repo: string, token: string, userId: string): Promise<{
        success: boolean;
        webhookId: any;
        simulated?: undefined;
    } | {
        success: boolean;
        simulated: boolean;
        webhookId?: undefined;
    }>;
    scanRepoCommits(monitorId: string, owner: string, repo: string, githubToken: string): Promise<{
        success: boolean;
        count: number;
    }>;
    handlePushEvent(payload: any): Promise<void>;
}
