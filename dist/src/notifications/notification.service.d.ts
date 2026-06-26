export declare class NotificationService {
    private readonly logger;
    send(webhookUrl: string | null, monitorName: string, monitorUrl: string | null, status: 'down' | 'up', details?: string, email?: string | null): Promise<void>;
    private sendWebhook;
    private sendEmail;
}
