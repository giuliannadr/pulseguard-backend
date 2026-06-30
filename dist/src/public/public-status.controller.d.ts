import { PrismaService } from '../prisma/prisma.service';
export declare class PublicStatusController {
    private prisma;
    constructor(prisma: PrismaService);
    getStatus(userId: string): Promise<{
        id: string;
        name: string;
        status: string;
        uptime: number | null;
        responseTimeMs: number | null;
        checks: {
            status: string;
            checkedAt: Date;
        }[];
    }[]>;
}
