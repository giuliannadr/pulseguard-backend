"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const ssrf_guard_1 = require("../common/ssrf-guard");
let NotificationService = NotificationService_1 = class NotificationService {
    logger = new common_1.Logger(NotificationService_1.name);
    resendApiKey = null;
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    onModuleInit() {
        this.resendApiKey = process.env.RESEND_API_KEY ?? null;
        if (this.resendApiKey) {
            this.logger.log('Resend email service ready');
        }
        else {
            this.logger.warn('RESEND_API_KEY not set — email notifications disabled');
        }
    }
    async send(webhookUrl, monitorName, monitorUrl, status, details, email) {
        const isRecovery = status === 'up';
        const emoji = isRecovery ? '✅' : '🔴';
        const title = isRecovery ? `${monitorName} volvió en línea` : `${monitorName} está CAÍDO`;
        await Promise.all([
            webhookUrl?.trim() ? this.sendWebhook(webhookUrl, monitorName, monitorUrl, isRecovery, emoji, title, details) : Promise.resolve(),
            email?.trim() ? this.sendEmail(email, monitorName, monitorUrl, isRecovery, title, details) : Promise.resolve(),
        ]);
    }
    async sendWebhook(webhookUrl, monitorName, monitorUrl, isRecovery, emoji, title, details) {
        try {
            await (0, ssrf_guard_1.assertSafeUrl)(webhookUrl);
        }
        catch {
            this.logger.warn(`Blocked unsafe webhook URL for ${monitorName}: ${webhookUrl}`);
            return;
        }
        const color = isRecovery ? 0x00e676 : 0xff1744;
        const urlLine = monitorUrl ? `\n**URL:** ${monitorUrl}` : '';
        const detailsLine = details ? `\n**Error:** ${details}` : '';
        const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
        const isSlack = webhookUrl.includes('hooks.slack.com');
        let payload;
        if (isDiscord) {
            payload = {
                embeds: [{
                        title: `${emoji} ${title}`,
                        description: `PulseGuard detectó un cambio de estado.${urlLine}${detailsLine}`,
                        color,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'PulseGuard Monitor' },
                    }],
            };
        }
        else if (isSlack) {
            payload = {
                text: `${emoji} *${title}*`,
                blocks: [{
                        type: 'section',
                        text: { type: 'mrkdwn', text: `${emoji} *${title}*\n${monitorUrl ?? ''}${details ? `\nError: ${details}` : ''}` },
                    }],
            };
        }
        else {
            payload = {
                event: isRecovery ? 'monitor_recovery' : 'monitor_down',
                monitor: monitorName,
                url: monitorUrl,
                status: isRecovery ? 'up' : 'down',
                detail: details ?? null,
                timestamp: new Date().toISOString(),
            };
        }
        try {
            await axios_1.default.post(webhookUrl, payload, { timeout: 5000 });
            this.logger.log(`Webhook enviado para ${monitorName} (${isRecovery ? 'up' : 'down'})`);
        }
        catch (err) {
            this.logger.warn(`Webhook falló para ${monitorName}: ${err.message}`);
        }
    }
    buildEmailHtml(title, color, rows, footer) {
        return `
<div style="background:#0A0A0A;color:#F0F0F0;font-family:monospace;padding:32px;border-radius:6px;max-width:520px">
  <div style="font-size:11px;color:#CAFF00;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">// PulseGuard Alertas</div>
  <h2 style="margin:0 0 24px;font-size:22px;color:${color}">${title}</h2>
  <table style="border-collapse:collapse;font-size:13px;width:100%">
    ${rows}
    <tr><td style="color:#888;padding:4px 0">Hora</td><td>${new Date().toLocaleString('es-AR')}</td></tr>
  </table>
  <div style="margin-top:24px;font-size:11px;color:#4A4A4A">${footer}</div>
</div>`;
    }
    async sendEmail(to, monitorName, monitorUrl, isRecovery, title, details) {
        if (!this.resendApiKey) {
            this.logger.warn('Email transport no disponible — omitiendo notificación por email');
            return;
        }
        const color = isRecovery ? '#00E676' : '#FF1744';
        const safeUrl = monitorUrl ? this.escapeHtml(monitorUrl) : null;
        const urlRow = safeUrl ? `<tr><td style="color:#888;padding:4px 0">URL</td><td><a href="${safeUrl}" style="color:#CAFF00">${safeUrl}</a></td></tr>` : '';
        const errorRow = details ? `<tr><td style="color:#888;padding:4px 0">Error</td><td style="color:#FF1744">${this.escapeHtml(details)}</td></tr>` : '';
        const rows = `
      <tr><td style="color:#888;padding:4px 0;width:80px">Monitor</td><td>${this.escapeHtml(monitorName)}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Estado</td><td style="color:${color}">${isRecovery ? '✅ En línea' : '🔴 Caído'}</td></tr>
      ${urlRow}${errorRow}
    `;
        const html = this.buildEmailHtml(title, color, rows, 'Enviado por PulseGuard · Gestioná tus alertas desde el dashboard');
        try {
            await axios_1.default.post('https://api.resend.com/emails', {
                from: 'PulseGuard <onboarding@resend.dev>',
                to,
                subject: `[PulseGuard] ${title}`,
                html,
            }, {
                headers: { Authorization: `Bearer ${this.resendApiKey}`, 'Content-Type': 'application/json' },
                timeout: 10000,
            });
            this.logger.log(`Email enviado a ${to} para ${monitorName}`);
        }
        catch (err) {
            this.logger.warn(`Email falló para ${monitorName}: ${err.response?.data?.message ?? err.message}`);
        }
    }
    async sendSecurityAlert(webhookUrl, monitorName, commitHash, riskType, severity, description, email) {
        const title = `⚠️ [${severity.toUpperCase()} RISK] Incidente de seguridad en ${monitorName}`;
        const emoji = '🛡️';
        await Promise.all([
            webhookUrl?.trim() ? this.sendSecurityWebhook(webhookUrl, monitorName, commitHash, riskType, severity, description, emoji, title) : Promise.resolve(),
            email?.trim() ? this.sendSecurityEmail(email, monitorName, commitHash, riskType, severity, description, title) : Promise.resolve(),
        ]);
    }
    async sendSecurityWebhook(webhookUrl, monitorName, commitHash, riskType, severity, description, emoji, title) {
        try {
            await (0, ssrf_guard_1.assertSafeUrl)(webhookUrl);
        }
        catch {
            this.logger.warn(`Blocked unsafe security webhook URL: ${webhookUrl}`);
            return;
        }
        const colors = { critical: 0xff1744, high: 0xff5252, medium: 0xffb300, low: 0x00e676 };
        const color = colors[severity.toLowerCase()] ?? 0xff1744;
        const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
        const isSlack = webhookUrl.includes('hooks.slack.com');
        let payload;
        if (isDiscord) {
            payload = { embeds: [{ title: `${emoji} ${title}`, description: `PulseGuard AI analizó un nuevo push.\n\n**Commit:** \`${commitHash.substring(0, 7)}\`\n**Tipo de riesgo:** ${riskType}\n**Descripción:** ${description}`, color, timestamp: new Date().toISOString(), footer: { text: 'PulseGuard Security Scanner' } }] };
        }
        else if (isSlack) {
            payload = { text: `${emoji} *${title}*`, blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `${emoji} *${title}*\n*Commit:* \`${commitHash.substring(0, 7)}\`\n*Riesgo:* ${riskType}\n*Descripción:* ${description}` } }] };
        }
        else {
            payload = { event: 'security_alert', monitor: monitorName, commit: commitHash, risk: riskType, severity, description, timestamp: new Date().toISOString() };
        }
        try {
            await axios_1.default.post(webhookUrl, payload, { timeout: 5000 });
            this.logger.log(`Security webhook enviado para ${monitorName}`);
        }
        catch (err) {
            this.logger.warn(`Security webhook falló para ${monitorName}: ${err.message}`);
        }
    }
    async sendSecurityEmail(to, monitorName, commitHash, riskType, severity, description, title) {
        if (!this.resendApiKey)
            return;
        const colors = { critical: '#FF1744', high: '#FF5252', medium: '#FFB300', low: '#00E676' };
        const color = colors[severity.toLowerCase()] ?? '#FF1744';
        const rows = `
      <tr><td style="color:#888;padding:4px 0;width:100px">Proyecto</td><td>${this.escapeHtml(monitorName)}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Commit</td><td><code>${this.escapeHtml(commitHash.substring(0, 7))}</code></td></tr>
      <tr><td style="color:#888;padding:4px 0">Tipo de riesgo</td><td style="color:${color};font-weight:bold">${this.escapeHtml(riskType)}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Severidad</td><td style="color:${color};font-weight:bold">${this.escapeHtml(severity.toUpperCase())}</td></tr>
      <tr><td style="color:#888;padding:4px 0;vertical-align:top">Descripción</td><td>${this.escapeHtml(description)}</td></tr>
    `;
        const html = this.buildEmailHtml(title, color, rows, 'Enviado por PulseGuard DevSecOps · Revisá el dashboard para ver las mitigaciones');
        try {
            await axios_1.default.post('https://api.resend.com/emails', {
                from: 'PulseGuard <onboarding@resend.dev>',
                to,
                subject: `[PulseGuard Seguridad] ${title}`,
                html,
            }, {
                headers: { Authorization: `Bearer ${this.resendApiKey}`, 'Content-Type': 'application/json' },
                timeout: 10000,
            });
            this.logger.log(`Security email enviado a ${to} para ${monitorName}`);
        }
        catch (err) {
            this.logger.warn(`Security email falló para ${to}: ${err.response?.data?.message ?? err.message}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notification.service.js.map