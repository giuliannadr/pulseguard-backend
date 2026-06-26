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
exports.PlaygroundController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const playground_service_1 = require("./playground.service");
let PlaygroundController = class PlaygroundController {
    service;
    constructor(service) {
        this.service = service;
    }
    testEndpoint(body) {
        return this.service.auditEndpoint(body.url, body.method || 'GET', body.headers || {}, body.body || null);
    }
    auditCode(body) {
        return this.service.auditCode(body.code, body.language || 'javascript');
    }
    inspectDomain(body) {
        return this.service.inspectDomain(body.domain);
    }
    simulateAttack(body) {
        return this.service.simulateAttack(body.url, body.attackType);
    }
};
exports.PlaygroundController = PlaygroundController;
__decorate([
    (0, common_1.Post)('test-endpoint'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "testEndpoint", null);
__decorate([
    (0, common_1.Post)('audit-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "auditCode", null);
__decorate([
    (0, common_1.Post)('inspect-domain'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "inspectDomain", null);
__decorate([
    (0, common_1.Post)('simulate-attack'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "simulateAttack", null);
exports.PlaygroundController = PlaygroundController = __decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60_000, limit: 10 } }),
    (0, common_1.Controller)('playground'),
    __metadata("design:paramtypes", [playground_service_1.PlaygroundService])
], PlaygroundController);
//# sourceMappingURL=playground.controller.js.map