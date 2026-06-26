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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicStatusController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PublicStatusController = class PublicStatusController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatus(userId) {
        const monitors = await this.prisma.monitor.findMany({
            where: { userId, isActive: true },
            include: {
                checks: { orderBy: { checkedAt: 'desc' }, take: 90 },
            },
            orderBy: { createdAt: 'asc' },
        });
        return monitors.map((m) => {
            const lastCheck = m.checks[0] ?? null;
            const upCount = m.checks.filter((c) => c.status === 'up').length;
            const uptime = m.checks.length > 0
                ? Math.round((upCount / m.checks.length) * 10000) / 100
                : null;
            return {
                id: m.id,
                name: m.name,
                url: m.url,
                status: lastCheck?.status ?? 'unknown',
                uptime,
                responseTimeMs: lastCheck?.responseTimeMs ?? null,
                checks: m.checks.map((c) => ({
                    status: c.status,
                    checkedAt: c.checkedAt,
                })),
            };
        });
    }
};
exports.PublicStatusController = PublicStatusController;
__decorate([
    (0, common_1.Get)('status/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicStatusController.prototype, "getStatus", null);
exports.PublicStatusController = PublicStatusController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicStatusController);
//# sourceMappingURL=public-status.controller.js.map