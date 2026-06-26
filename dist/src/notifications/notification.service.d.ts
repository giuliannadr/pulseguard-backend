export declare class NotificationService {
    private readonly logger;
    send(webhookUrl: string | null, monitorName: string, monitorUrl: string | null, status: 'down' | 'up', details?: string, email?: string | null): Promise<void>;
    private sendWebhook;
    private sendEmail;
    sendSecurityAlert(webhookUrl: string | null, monitorName: string, commitHash: string, riskType: string, severity: string, description: string, email?: string | null): Promise<void>;
    private sendSecurityWebhook;
    private sendSecurityEmail;
}
