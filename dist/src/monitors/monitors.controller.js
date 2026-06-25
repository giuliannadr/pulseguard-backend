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
exports.MonitorsController = void 0;
const common_1 = require("@nestjs/common");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const monitors_service_1 = require("./monitors.service");
const create_monitor_dto_1 = require("./dto/create-monitor.dto");
const update_monitor_dto_1 = require("./dto/update-monitor.dto");
let MonitorsController = class MonitorsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        return this.service.findAll(req.user.id);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user.id);
    }
    create(dto, req) {
        return this.service.create(req.user.id, dto);
    }
    update(id, dto, req) {
        return this.service.update(id, req.user.id, dto);
    }
    remove(id, req) {
        return this.service.remove(id, req.user.id);
    }
    getChecks(id, limit, req) {
        return this.service.getChecks(id, req.user.id, limit ? parseInt(limit) : 100);
    }
    getMetrics(id, req) {
        return this.service.getMetrics(id, req.user.id);
    }
    runCheckNow(id, req) {
        return this.service.runCheckNow(id, req.user.id);
    }
    getSecurityIncidents(id, req) {
        return this.service.getSecurityIncidents(id, req.user.id);
    }
};
exports.MonitorsController = MonitorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_monitor_dto_1.CreateMonitorDto, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_monitor_dto_1.UpdateMonitorDto, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/checks'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "getChecks", null);
__decorate([
    (0, common_1.Get)(':id/metrics'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)(':id/check-now'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "runCheckNow", null);
__decorate([
    (0, common_1.Get)(':id/security-incidents'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MonitorsController.prototype, "getSecurityIncidents", null);
exports.MonitorsController = MonitorsController = __decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('monitors'),
    __metadata("design:paramtypes", [monitors_service_1.MonitorsService])
], MonitorsController);
//# sourceMappingURL=monitors.controller.js.map