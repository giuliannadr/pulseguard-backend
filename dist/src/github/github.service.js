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
const notification_service_1 = require("../notifications/notification.service");
const axios_1 = __importDefault(require("axios"));
let GithubService = GithubService_1 = class GithubService {
    prisma;
    aiService;
    notifications;
    logger = new common_1.Logger(GithubService_1.name);
    WEBHOOK_URL = `${process.env.API_URL ?? 'https://pulseguard-backend-production.up.railway.app/api'}/github/webhook`;
    constructor(prisma, aiService, notifications) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.notifications = notifications;
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
    async autoConfigureWebhook(monitorId, owner, repo, token, userId) {
        const monitor = await this.prisma.monitor.findFirst({
            where: { id: monitorId, userId },
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
            const reason = error.response?.data?.message || error.message || 'Unknown error';
            return {
                success: false,
                webhookConfigured: false,
                repoLinked: true,
                error: `Repo linked but webhook creation failed: ${reason}. You can create it manually in GitHub → Settings → Webhooks.`,
            };
        }
    }
    async scanRepoCommits(monitorId, owner, repo, githubToken, force = false) {
        try {
            this.logger.log(`Scanning commits for ${owner}/${repo} on monitor ${monitorId}...`);
            const { data: commits } = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            if (force) {
                const hashes = commits.map((c) => c.sha);
                const deleted = await this.prisma.securityIncident.deleteMany({
                    where: { monitorId, commitHash: { in: hashes } },
                });
                this.logger.log(`Force rescan: deleted ${deleted.count} stale incidents for monitor ${monitorId}`);
            }
            const toScan = [];
            for (const item of commits) {
                const existing = await this.prisma.securityIncident.findFirst({
                    where: { monitorId, commitHash: item.sha },
                });
                if (!existing)
                    toScan.push(item);
            }
            if (toScan.length === 0) {
                return { success: true, count: 0 };
            }
            const diffsSettled = await Promise.allSettled(toScan.map(item => axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/commits/${item.sha}`, { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3.diff' } }).then(r => r.data)
                .catch(() => 'Modified files in repository')));
            const analyses = [];
            for (const r of diffsSettled) {
                const diffText = r.status === 'fulfilled' ? r.value : 'Modified files in repository';
                const analysis = await this.aiService.analyzeCommit(diffText);
                analyses.push(analysis);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            const monitor = await this.prisma.monitor.findUnique({ where: { id: monitorId } });
            const savedIncidents = [];
            for (let i = 0; i < toScan.length; i++) {
                const item = toScan[i];
                const analysis = analyses[i];
                if (!analysis)
                    continue;
                const commitHash = item.sha;
                const commitAuthor = `${item.commit.author.name} <${item.commit.author.email}>`;
                const incident = await this.prisma.securityIncident.create({
                    data: { monitorId, commitHash, commitAuthor, riskType: analysis.riskType, severity: analysis.severity, description: analysis.description, recommendation: analysis.recommendation },
                });
                savedIncidents.push(incident);
                if (monitor) {
                    await this.notifications.sendSecurityAlert(monitor.notificationWebhookUrl, monitor.name, commitHash, analysis.riskType, analysis.severity, analysis.description, monitor.notificationEmail);
                }
            }
            this.logger.log(`Scan complete for ${owner}/${repo}: saved ${savedIncidents.length} new incidents`);
            return { success: true, count: savedIncidents.length };
        }
        catch (error) {
            this.logger.error(`Failed to scan commits for ${owner}/${repo}`, error.response?.data || error.message);
            throw error;
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
            const added = (commit.added ?? []).join('\n  + ');
            const removed = (commit.removed ?? []).join('\n  - ');
            const modified = (commit.modified ?? []).join('\n  ~ ');
            const diffText = [
                `Commit: ${commit.id}`,
                `Message: ${commit.message}`,
                `Author: ${commit.author?.name} <${commit.author?.email}>`,
                added ? `Added files:\n  + ${added}` : '',
                removed ? `Removed files:\n  - ${removed}` : '',
                modified ? `Modified files:\n  ~ ${modified}` : '',
            ].filter(Boolean).join('\n');
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
                await this.notifications.sendSecurityAlert(monitor.notificationWebhookUrl, monitor.name, commit.id, analysis.riskType, analysis.severity, analysis.description, monitor.notificationEmail);
            }
        }
    }
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = GithubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        notification_service_1.NotificationService])
], GithubService);
//# sourceMappingURL=github.service.js.map