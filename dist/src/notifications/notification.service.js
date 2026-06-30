"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const nodemailer = __importStar(require("nodemailer"));
let NotificationService = NotificationService_1 = class NotificationService {
    logger = new common_1.Logger(NotificationService_1.name);
    transporter = null;
    fromAddress = 'PulseGuard <noreply@pulseguard.dev>';
    async onModuleInit() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
            this.fromAddress = `PulseGuard <${testAccount.user}>`;
            this.logger.log(`Ethereal SMTP ready — preview emails at https://ethereal.email/messages (user: ${testAccount.user})`);
        }
        catch (err) {
            this.logger.warn(`Could not create Ethereal test account: ${err.message} — email notifications disabled`);
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
            new URL(webhookUrl);
        }
        catch {
            this.logger.warn(`Invalid webhook URL for ${monitorName}: ${webhookUrl}`);
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
    async sendEmail(to, monitorName, monitorUrl, isRecovery, title, details) {
        if (!this.transporter) {
            this.logger.warn('Email transport no disponible — omitiendo notificación por email');
            return;
        }
        const color = isRecovery ? '#00E676' : '#FF1744';
        const urlRow = monitorUrl ? `<tr><td style="color:#888;padding:4px 0">URL</td><td><a href="${monitorUrl}" style="color:#CAFF00">${monitorUrl}</a></td></tr>` : '';
        const errorRow = details ? `<tr><td style="color:#888;padding:4px 0">Error</td><td style="color:#FF1744">${details}</td></tr>` : '';
        const html = `
<div style="background:#0A0A0A;color:#F0F0F0;font-family:monospace;padding:32px;border-radius:6px;max-width:520px">
  <div style="font-size:11px;color:#CAFF00;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">// PulseGuard Alertas</div>
  <h2 style="margin:0 0 24px;font-size:22px;color:${color}">${title}</h2>
  <table style="border-collapse:collapse;font-size:13px;width:100%">
    <tr><td style="color:#888;padding:4px 0;width:80px">Monitor</td><td>${monitorName}</td></tr>
    <tr><td style="color:#888;padding:4px 0">Estado</td><td style="color:${color}">${isRecovery ? '✅ En línea' : '🔴 Caído'}</td></tr>
    ${urlRow}${errorRow}
    <tr><td style="color:#888;padding:4px 0">Hora</td><td>${new Date().toLocaleString('es-AR')}</td></tr>
  </table>
  <div style="margin-top:24px;font-size:11px;color:#4A4A4A">Enviado por PulseGuard · Gestioná tus alertas desde el dashboard</div>
</div>`;
        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to,
                subject: `[PulseGuard] ${title}`,
                html,
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            this.logger.log(`Email enviado a ${to} para ${monitorName}`);
            if (previewUrl) {
                this.logger.log(`Vista previa del email: ${previewUrl}`);
            }
        }
        catch (err) {
            this.logger.warn(`Email falló para ${monitorName}: ${err.message}`);
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
            new URL(webhookUrl);
        }
        catch {
            return;
        }
        const colors = {
            critical: 0xff1744,
            high: 0xff5252,
            medium: 0xffb300,
            low: 0x00e676
        };
        const color = colors[severity.toLowerCase()] ?? 0xff1744;
        const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
        const isSlack = webhookUrl.includes('hooks.slack.com');
        let payload;
        if (isDiscord) {
            payload = {
                embeds: [{
                        title: `${emoji} ${title}`,
                        description: `PulseGuard AI analizó un nuevo push.\n\n**Commit:** \`${commitHash.substring(0, 7)}\`\n**Tipo de riesgo:** ${riskType}\n**Descripción:** ${description}`,
                        color,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'PulseGuard Security Scanner' },
                    }],
            };
        }
        else if (isSlack) {
            payload = {
                text: `${emoji} *${title}*`,
                blocks: [{
                        type: 'section',
                        text: { type: 'mrkdwn', text: `${emoji} *${title}*\n*Commit:* \`${commitHash.substring(0, 7)}\`\n*Riesgo:* ${riskType}\n*Descripción:* ${description}` },
                    }],
            };
        }
        else {
            payload = {
                event: 'security_alert',
                monitor: monitorName,
                commit: commitHash,
                risk: riskType,
                severity,
                description,
                timestamp: new Date().toISOString(),
            };
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
        if (!this.transporter) {
            this.logger.warn('Email transport no disponible — omitiendo notificación de seguridad');
            return;
        }
        const colors = {
            critical: '#FF1744',
            high: '#FF5252',
            medium: '#FFB300',
            low: '#00E676'
        };
        const color = colors[severity.toLowerCase()] ?? '#FF1744';
        const html = `
<div style="background:#0A0A0A;color:#F0F0F0;font-family:monospace;padding:32px;border-radius:6px;max-width:520px">
  <div style="font-size:11px;color:#CAFF00;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">// PulseGuard SecOps</div>
  <h2 style="margin:0 0 24px;font-size:20px;color:${color}">${title}</h2>
  <table style="border-collapse:collapse;font-size:13px;width:100%">
    <tr><td style="color:#888;padding:4px 0;width:100px">Proyecto</td><td>${monitorName}</td></tr>
    <tr><td style="color:#888;padding:4px 0">Commit</td><td><code>${commitHash.substring(0, 7)}</code></td></tr>
    <tr><td style="color:#888;padding:4px 0">Tipo de riesgo</td><td style="color:${color};font-weight:bold">${riskType}</td></tr>
    <tr><td style="color:#888;padding:4px 0">Severidad</td><td style="color:${color};font-weight:bold">${severity.toUpperCase()}</td></tr>
    <tr><td style="color:#888;padding:4px 0;vertical-align:top">Descripción</td><td>${description}</td></tr>
  </table>
  <div style="margin-top:24px;font-size:11px;color:#4A4A4A">Enviado por PulseGuard DevSecOps · Revisá el dashboard para ver las mitigaciones</div>
</div>`;
        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to,
                subject: `[PulseGuard Seguridad] ${title}`,
                html,
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            this.logger.log(`Security email enviado a ${to} para ${monitorName}`);
            if (previewUrl) {
                this.logger.log(`Vista previa del email de seguridad: ${previewUrl}`);
            }
        }
        catch (err) {
            this.logger.warn(`Security email falló para ${to}: ${err.message}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notification.service.js.map