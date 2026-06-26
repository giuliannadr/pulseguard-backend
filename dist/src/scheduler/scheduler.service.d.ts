import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
import { NotificationService } from '../notifications/notification.service';
export declare class SchedulerService {
    private prisma;
    private checker;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, checker: CheckerService, notifications: NotificationService);
    runScheduledChecks(): Promise<void>;
    private runCheck;
}
