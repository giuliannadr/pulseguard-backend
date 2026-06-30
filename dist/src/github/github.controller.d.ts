import type { RawBodyRequest } from '@nestjs/common';
import { GithubService } from './github.service';
export declare class GithubController {
    private readonly githubService;
    constructor(githubService: GithubService);
    getRepos(req: any): Promise<any>;
    connectWebhook(monitorId: string, body: {
        owner: string;
        repo: string;
    }, githubToken: string, req: any): Promise<{
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
    handleWebhook(event: string, signature: string, req: RawBodyRequest<any>, payload: any): Promise<{
        received: boolean;
    }>;
}
