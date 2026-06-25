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
exports.SecurityIncidentsController = void 0;
const common_1 = require("@nestjs/common");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let SecurityIncidentsController = class SecurityIncidentsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(req) {
        return this.prisma.securityIncident.findMany({
            where: { monitor: { userId: req.user.id } },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                monitor: {
                    select: { name: true, url: true }
                }
            }
        });
    }
    async resolve(id, req) {
        const incident = await this.prisma.securityIncident.findFirst({
            where: { id, monitor: { userId: req.user.id } }
        });
        if (!incident)
            throw new common_1.NotFoundException('Incident not found');
        return this.prisma.securityIncident.update({
            where: { id },
            data: { resolved: true }
        });
    }
};
exports.SecurityIncidentsController = SecurityIncidentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityIncidentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityIncidentsController.prototype, "resolve", null);
exports.SecurityIncidentsController = SecurityIncidentsController = __decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('security-incidents'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SecurityIncidentsController);
//# sourceMappingURL=security-incidents.controller.js.map