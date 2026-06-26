import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async send(webhookUrl: string, monitorName: string, monitorUrl: string | null, status: 'down' | 'up', details?: string) {
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

    let payload: object;

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
    } else if (isSlack) {
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
    } else {
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
      await axios.post(webhookUrl, payload, { timeout: 5000 });
      this.logger.log(`Notification sent for ${monitorName} (${status})`);
    } catch (err: any) {
      this.logger.warn(`Failed to send notification for ${monitorName}: ${err.message}`);
    }
  }
}
