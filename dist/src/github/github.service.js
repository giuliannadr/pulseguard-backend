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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GithubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const axios_1 = __importDefault(require("axios"));
let GithubService = GithubService_1 = class GithubService {
    prisma;
    aiService;
    logger = new common_1.Logger(GithubService_1.name);
    WEBHOOK_URL = process.env.API_URL
        ? `${process.env.API_URL}/github/webhook`
        : 'https://pulseguard-backend.up.railway.app/github/webhook';
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
    }
    async getUserRepos(token) {
        try {
            const { data } = await axios_1.default.get('https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return data.map((repo) => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                html_url: repo.html_url,
                private: repo.private,
                updated_at: repo.updated_at,
                owner: { login: repo.owner.login },
            }));
        }
        catch (error) {
            this.logger.error('Failed to fetch github repos', error.response?.data || error.message);
            throw error;
        }
    }
    async autoConfigureWebhook(monitorId, owner, repo, token) {
        const monitor = await this.prisma.monitor.findUnique({
            where: { id: monitorId },
        });
        if (!monitor)
            throw new common_1.NotFoundException('Monitor not found');
        const webhookPayload = {
            name: 'web',
            active: true,
            events: ['push'],
            config: {
                url: `${this.WEBHOOK_URL}?monitorId=${monitorId}`,
                content_type: 'json',
            },
        };
        try {
            const { data } = await axios_1.default.post(`https://api.github.com/repos/${owner}/${repo}/hooks`, webhookPayload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            await this.prisma.monitor.update({
                where: { id: monitorId },
                data: {
                    githubRepoUrl: `https://github.com/${owner}/${repo}`,
                    githubWebhookId: data.id.toString(),
                },
            });
            return { success: true, webhookId: data.id };
        }
        catch (error) {
            this.logger.error('Failed to create webhook', error.response?.data || error.message);
            await this.prisma.monitor.update({
                where: { id: monitorId },
                data: { githubRepoUrl: `https://github.com/${owner}/${repo}` },
            });
            return { success: true, simulated: true };
        }
    }
    async handlePushEvent(payload) {
        const repoUrl = payload.repository?.html_url;
        if (!repoUrl)
            return;
        const monitors = await this.prisma.monitor.findMany({
            where: { githubRepoUrl: repoUrl },
        });
        if (monitors.length === 0)
            return;
        const commits = payload.commits || [];
        if (commits.length === 0)
            return;
        for (const commit of commits) {
            let diffText = 'Added some new code';
            try {
                const { data } = await axios_1.default.get(commit.url, {
                    headers: { Accept: 'application/vnd.github.v3.diff' },
                });
                diffText = data;
            }
            catch (e) {
                this.logger.warn(`Failed to fetch diff for commit ${commit.id}`);
            }
            const analysis = await this.aiService.analyzeCommit(diffText);
            for (const monitor of monitors) {
                await this.prisma.securityIncident.create({
                    data: {
                        monitorId: monitor.id,
                        commitHash: commit.id,
                        commitAuthor: `${commit.author.name} <${commit.author.email}>`,
                        riskType: analysis.riskType,
                        severity: analysis.severity,
                        description: analysis.description,
                        recommendation: analysis.recommendation,
                    },
                });
            }
        }
    }
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = GithubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], GithubService);
//# sourceMappingURL=github.service.js.map