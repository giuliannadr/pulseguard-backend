import { AiService } from '../ai/ai.service';
import { CheckerService } from '../checker/checker.service';
export declare class PlaygroundService {
    private readonly aiService;
    private readonly checkerService;
    private readonly logger;
    private genAI;
    constructor(aiService: AiService, checkerService: CheckerService);
    private cleanJson;
    auditEndpoint(url: string, method: string, headers: Record<string, string>, body: any): Promise<{
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
    auditCode(code: string, language: string): Promise<any>;
    inspectDomain(domain: string): Promise<{
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
    simulateAttack(url: string, attackType: string): Promise<{
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
    generatePatch(code: string, findings: string, language: string): Promise<any>;
    getNetworkDiagnostics(url: string): Promise<{
        success: boolean;
        timings: {
            dnsLookupMs: number;
            tcpConnectMs: number;
            tlsHandshakeMs: number;
            ttfbMs: number;
            totalMs: number;
        };
        advice: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        timings?: undefined;
        advice?: undefined;
    }>;
}
