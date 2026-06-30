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
exports.GithubController = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const github_service_1 = require("./github.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
let GithubController = class GithubController {
    githubService;
    constructor(githubService) {
        this.githubService = githubService;
    }
    async getRepos(req) {
        const token = req.headers['x-github-token'];
        if (!token)
            throw new common_1.UnauthorizedException('Missing GitHub token');
        const repos = await this.githubService.getUserRepos(token);
        return repos;
    }
    async connectWebhook(monitorId, body, githubToken, req) {
        if (!githubToken) {
            throw new common_1.UnauthorizedException('Missing x-github-token header');
        }
        return this.githubService.autoConfigureWebhook(monitorId, body.owner, body.repo, githubToken, req.user.id);
    }
    async handleWebhook(event, signature, req, payload) {
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (secret) {
            if (!signature) {
                throw new common_1.UnauthorizedException('Missing webhook signature');
            }
            const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(payload));
            const expected = `sha256=${(0, crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex')}`;
            const sigBuf = Buffer.from(signature);
            const expBuf = Buffer.from(expected);
            const valid = sigBuf.length === expBuf.length && (0, crypto_1.timingSafeEqual)(sigBuf, expBuf);
            if (!valid) {
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
        }
        if (event === 'push') {
            await this.githubService.handlePushEvent(payload);
        }
        return { received: true };
    }
};
exports.GithubController = GithubController;
__decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Get)('repos'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GithubController.prototype, "getRepos", null);
__decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Post)('connect/:monitorId'),
    __param(0, (0, common_1.Param)('monitorId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-github-token')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], GithubController.prototype, "connectWebhook", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Headers)('x-github-event')),
    __param(1, (0, common_1.Headers)('x-hub-signature-256')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], GithubController.prototype, "handleWebhook", null);
exports.GithubController = GithubController = __decorate([
    (0, common_1.Controller)('github'),
    __metadata("design:paramtypes", [github_service_1.GithubService])
], GithubController);
//# sourceMappingURL=github.controller.js.map