import { PlaygroundService } from './playground.service';
export declare class PlaygroundController {
    private readonly service;
    constructor(service: PlaygroundService);
    testEndpoint(body: {
        url: string;
        method: string;
        headers?: Record<string, string>;
        body?: any;
    }): Promise<{
        status: number;
        responseHeaders: Record<string, string>;
        responseBody: any;
        latencyMs: number;
        errorMsg: string | null;
        audit: {
            overallRisk: string;
            findings: string[];
            recommendation: string;
        };
    }>;
    auditCode(body: {
        code: string;
        language: string;
    }): Promise<any>;
    inspectDomain(body: {
        domain: string;
    }): Promise<{
        domain: string;
        dnsInfo: any;
        sslInfo: any;
        audit: {
            securityScore: string;
            dnsFindings: string[];
            sslFindings: string[];
            advice: string;
        };
    }>;
    simulateAttack(body: {
        url: string;
        attackType: string;
    }): Promise<{
        attackType: string;
        description: string;
        testedUrl: string;
        results: any[];
        analysis: {
            isVulnerable: string;
            severity: string;
            diagnosis: string;
            mitigation: string;
        };
    }>;
}
