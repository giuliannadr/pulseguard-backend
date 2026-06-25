export interface CheckResult {
    status: 'up' | 'down' | 'degraded';
    statusCode: number | null;
    responseTimeMs: number | null;
    sslDaysLeft: number | null;
    errorMessage: string | null;
}
export declare class CheckerService {
    private readonly logger;
    checkUrl(url: string, expectedStatus: number, expectedText?: string | null): Promise<CheckResult>;
    getSslDaysLeft(url: string): Promise<number | null>;
}
