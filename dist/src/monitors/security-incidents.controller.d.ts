import { PrismaService } from '../prisma/prisma.service';
export declare class SecurityIncidentsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(req: any): Promise<({
        monitor: {
            name: string;
            url: string;
        };
    } & {
        id: string;
        createdAt: Date;
        monitorId: string;
        commitHash: string;
        commitAuthor: string | null;
        riskType: string;
        severity: string;
        description: string;
        recommendation: string;
        resolved: boolean;
    })[]>;
    resolve(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        monitorId: string;
        commitHash: string;
        commitAuthor: string | null;
        riskType: string;
        severity: string;
        description: string;
        recommendation: string;
        resolved: boolean;
    }>;
}
