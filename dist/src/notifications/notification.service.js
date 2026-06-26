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
let NotificationService = NotificationService_1 = class NotificationService {
    logger = new common_1.Logger(NotificationService_1.name);
    async send(webhookUrl, monitorName, monitorUrl, status, details) {
        try {
            new URL(webhookUrl);
        }
        catch {
            this.logger.warn(`Invalid webhook URL for ${monitorName}: ${webhookUrl}`);
            return;
        }
        const isRecovery = status === 'up';
        const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
        const isSlack = webhookUrl.includes('hooks.slack.com');
        const emoji = isRecovery ? '✅' : '🔴';
        const title = isRecovery
            ? `${monitorName} is back online`
            : `${monitorName} is DOWN`;
        const color = isRecovery ? 0x00e676 : 0xff1744;
        const urlLine = monitorUrl ? `\n**URL:** ${monitorUrl}` : '';
        const detailsLine = details ? `\n**Error:** ${details}` : '';
        let payload;
        if (isDiscord) {
            payload = {
                embeds: [{
                        title: `${emoji} ${title}`,
                        description: `PulseGuard detected a status change.${urlLine}${detailsLine}`,
                        color,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'PulseGuard Monitor' },
                    }],
            };
        }
        else if (isSlack) {
            payload = {
                text: `${emoji} *${title}*`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${emoji} *${title}*\n${monitorUrl ?? ''}${details ? `\nError: ${details}` : ''}`,
                        },
                    },
                ],
            };
        }
        else {
            payload = {
                event: isRecovery ? 'monitor_recovery' : 'monitor_down',
                monitor: monitorName,
                url: monitorUrl,
                status,
                detail: details ?? null,
                timestamp: new Date().toISOString(),
            };
        }
        try {
            await axios_1.default.post(webhookUrl, payload, { timeout: 5000 });
            this.logger.log(`Notification sent for ${monitorName} (${status})`);
        }
        catch (err) {
            this.logger.warn(`Failed to send notification for ${monitorName}: ${err.message}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notification.service.js.map