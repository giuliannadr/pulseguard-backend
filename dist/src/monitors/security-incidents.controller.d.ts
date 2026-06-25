import { PrismaService } from '../prisma/prisma.service';
export declare class SecurityIncidentsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(req: any): Promise<({
        monitor: {
            url: string;
            name: string;
        };
    } & {
        riskType: string;
        severity: string;
        description: string;
        recommendation: string;
        id: string;
        createdAt: Date;
        monitorId: string;
        commitHash: string;
        commitAuthor: string | null;
        resolved: boolean;
    })[]>;
    resolve(id: string, req: any): Promise<{
        riskType: string;
        severity: string;
        description: string;
        recommendation: string;
        id: string;
        createdAt: Date;
        monitorId: string;
        commitHash: string;
        commitAuthor: string | null;
        resolved: boolean;
    }>;
}
