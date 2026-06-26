"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const checker_service_1 = require("../checker/checker.service");
const notification_service_1 = require("../notifications/notification.service");
function isInMaintenance(windows, now) {
    if (!windows?.length)
        return false;
    const day = now.getDay();
    const totalMins = now.getHours() * 60 + now.getMinutes();
    return windows.some(w => {
        if (!w.days.includes(day))
            return false;
        const start = w.startHour * 60 + w.startMin;
        const end = w.endHour * 60 + w.endMin;
        return end > start ? totalMins >= start && totalMins < end : totalMins >= start || totalMins < end;
    });
}
let SchedulerService = SchedulerService_1 = class SchedulerService {
    prisma;
    checker;
    notifications;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(prisma, checker, notifications) {
        this.prisma = prisma;
        this.checker = checker;
        this.notifications = notifications;
    }
    async runScheduledChecks() {
        const monitors = await this.prisma.monitor.findMany({
            where: { isActive: true, NOT: { url: null } },
        });
        const now = new Date();
        for (const monitor of monitors) {
            if (isInMaintenance(monitor.maintenanceWindows, now)) {
                this.logger.log(`[MAINTENANCE] Skipping ${monitor.name}`);
                continue;
            }
            const lastCheck = await this.prisma.check.findFirst({
                where: { monitorId: monitor.id },
                orderBy: { checkedAt: 'desc' },
            });
            const minutesSinceLast = lastCheck
                ? (now.getTime() - lastCheck.checkedAt.getTime()) / 60_000
                : Infinity;
            if (minutesSinceLast >= monitor.intervalMinutes) {
                this.runCheck(monitor, lastCheck?.status ?? null).catch((err) => this.logger.error(`Check failed for ${monitor.url}: ${err.message}`));
            }
        }
    }
    async runCheck(monitor, previousStatus) {
        if (!monitor.url)
            return;
        const result = await this.checker.checkUrl(monitor.url, monitor.expectedStatus, monitor.expectedText);
        await this.prisma.check.create({ data: { monitorId: monitor.id, ...result } });
        const prev = previousStatus ?? monitor.lastStatus;
        const curr = result.status;
        const wentDown = curr === 'down' && prev !== 'down';
        const recovered = (curr === 'up' || curr === 'degraded') && prev === 'down';
        if (wentDown || recovered) {
            this.notifications.send(monitor.notificationWebhookUrl, monitor.name, monitor.url, wentDown ? 'down' : 'up', wentDown ? (result.errorMessage ?? undefined) : undefined, monitor.notificationEmail);
        }
        await this.prisma.monitor.update({
            where: { id: monitor.id },
            data: {
                lastStatus: curr,
                securityGrade: result.securityGrade,
                securityHeaders: result.securityHeaders ?? undefined,
            },
        });
        this.logger.log(`[${curr.toUpperCase()}] ${monitor.url} — ${result.responseTimeMs}ms`);
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "runScheduledChecks", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        checker_service_1.CheckerService,
        notification_service_1.NotificationService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map