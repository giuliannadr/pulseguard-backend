import { PrismaService } from '../prisma/prisma.service';
export declare class SecurityIncidentsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(req: any): Promise<any>;
    resolve(id: string, req: any): Promise<any>;
}
