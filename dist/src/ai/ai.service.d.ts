export interface SecurityAnalysis {
    riskType: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
    description: string;
    recommendation: string;
}
export declare class AiService {
    private readonly logger;
    private genAI;
    constructor();
    analyzeCommit(diff: string): Promise<SecurityAnalysis>;
}
