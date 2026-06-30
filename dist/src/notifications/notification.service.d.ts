import { OnModuleInit } from '@nestjs/common';
export declare class NotificationService implements OnModuleInit {
    private readonly logger;
    private resendApiKey;
    private escapeHtml;
    onModuleInit(): void;
    send(webhookUrl: string | null, monitorName: string, monitorUrl: string | null, status: 'down' | 'up', details?: string, email?: string | null): Promise<void>;
    private sendWebhook;
    private buildEmailHtml;
    private sendEmail;
    sendSecurityAlert(webhookUrl: string | null, monitorName: string, commitHash: string, riskType: string, severity: string, description: string, email?: string | null): Promise<void>;
    private sendSecurityWebhook;
    private sendSecurityEmail;
}
