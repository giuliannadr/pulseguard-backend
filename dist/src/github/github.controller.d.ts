import { GithubService } from './github.service';
export declare class GithubController {
    private readonly githubService;
    constructor(githubService: GithubService);
    listRepos(githubToken: string): Promise<any>;
    connectWebhook(monitorId: string, body: {
        owner: string;
        repo: string;
    }, githubToken: string): Promise<{
        success: boolean;
        webhookId: any;
        simulated?: undefined;
    } | {
        success: boolean;
        simulated: boolean;
        webhookId?: undefined;
    }>;
    handleWebhook(event: string, payload: any): Promise<{
        received: boolean;
    }>;
}
