export interface CheckResult {
    status: 'up' | 'down' | 'degraded';
    statusCode: number | null;
    responseTimeMs: number | null;
    sslDaysLeft: number | null;
    errorMessage: string | null;
    securityGrade?: string | null;
    securityHeaders?: any | null;
}
export declare class CheckerService {
    private readonly logger;
    checkUrl(url: string, expectedStatus: number, expectedText?: string | null): Promise<CheckResult>;
    getSslDaysLeft(url: string): Promise<number | null>;
    evaluateSecurityHeaders(headers: Headers, isHttps: boolean): {
        grade: string;
        score: number;
        findings: string[];
        headers: {
            csp: string | null;
            hsts: string | null;
            xFrame: string | null;
            xContentType: string | null;
            referrer: string | null;
            permissions: string | null;
        };
    };
    measureConnectionDetail(urlStr: string): Promise<{
        dnsLookupMs: number;
        tcpConnectMs: number;
        tlsHandshakeMs: number;
        ttfbMs: number;
        totalMs: number;
    }>;
}
