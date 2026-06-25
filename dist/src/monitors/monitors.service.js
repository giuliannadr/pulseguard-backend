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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const checker_service_1 = require("../checker/checker.service");
let MonitorsService = class MonitorsService {
    prisma;
    checker;
    constructor(prisma, checker) {
        this.prisma = prisma;
        this.checker = checker;
    }
    findAll(userId) {
        return this.prisma.monitor.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                checks: {
                    orderBy: { checkedAt: 'desc' },
                    take: 1,
                },
            },
        });
    }
    async findOne(id, userId) {
        const monitor = await this.prisma.monitor.findFirst({ where: { id, userId } });
        if (!monitor)
            throw new common_1.NotFoundException('Monitor not found');
        return monitor;
    }
    create(userId, dto) {
        return this.prisma.monitor.create({
            data: {
                userId,
                name: dto.name,
                url: dto.url,
                expectedStatus: dto.expectedStatus ?? 200,
                expectedText: dto.expectedText,
                intervalMinutes: dto.intervalMinutes ?? 5,
            },
        });
    }
    async update(id, userId, dto) {
        await this.findOne(id, userId);
        return this.prisma.monitor.update({ where: { id }, data: dto });
    }
    async remove(id, userId) {
        await this.findOne(id, userId);
        return this.prisma.monitor.delete({ where: { id } });
    }
    async getChecks(id, userId, limit = 100) {
        await this.findOne(id, userId);
        return this.prisma.check.findMany({
            where: { monitorId: id },
            orderBy: { checkedAt: 'desc' },
            take: limit,
        });
    }
    async getMetrics(id, userId) {
        await this.findOne(id, userId);
        const checks = await this.prisma.check.findMany({
            where: { monitorId: id },
            orderBy: { checkedAt: 'desc' },
            take: 500,
        });
        if (checks.length === 0)
            return { uptime: null, avgResponseMs: null, totalChecks: 0 };
        const upCount = checks.filter((c) => c.status === 'up').length;
        const withResponse = checks.filter((c) => c.responseTimeMs !== null);
        const avgResponseMs = withResponse.length > 0
            ? Math.round(withResponse.reduce((s, c) => s + c.responseTimeMs, 0) / withResponse.length)
            : null;
        return {
            uptime: Math.round((upCount / checks.length) * 10000) / 100,
            avgResponseMs,
            totalChecks: checks.length,
        };
    }
    async runCheckNow(id, userId) {
        const monitor = await this.findOne(id, userId);
        const result = await this.checker.checkUrl(monitor.url, monitor.expectedStatus, monitor.expectedText);
        return this.prisma.check.create({
            data: { monitorId: id, ...result },
        });
    }
    async getSecurityIncidents(id, userId) {
        await this.findOne(id, userId);
        return this.prisma.securityIncident.findMany({
            where: { monitorId: id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.MonitorsService = MonitorsService;
exports.MonitorsService = MonitorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        checker_service_1.CheckerService])
], MonitorsService);
//# sourceMappingURL=monitors.service.js.map