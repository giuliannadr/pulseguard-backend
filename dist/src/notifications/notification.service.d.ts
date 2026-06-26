export declare class NotificationService {
    private readonly logger;
    send(webhookUrl: string, monitorName: string, monitorUrl: string | null, status: 'down' | 'up', details?: string): Promise<void>;
}
