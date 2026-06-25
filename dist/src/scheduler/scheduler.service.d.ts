import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
export declare class SchedulerService {
    private prisma;
    private checker;
    private readonly logger;
    constructor(prisma: PrismaService, checker: CheckerService);
    runScheduledChecks(): Promise<void>;
    private runCheck;
}
