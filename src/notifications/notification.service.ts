import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async send(
    webhookUrl: string | null,
    monitorName: string,
    monitorUrl: string | null,
    status: 'down' | 'up',
    details?: string,
    email?: string | null,
  ) {
    const isRecovery = status === 'up';
    const emoji = isRecovery ? '✅' : '🔴';
    const title = isRecovery ? `${monitorName} is back online` : `${monitorName} is DOWN`;

    await Promise.all([
      webhookUrl?.trim() ? this.sendWebhook(webhookUrl, monitorName, monitorUrl, isRecovery, emoji, title, details) : Promise.resolve(),
      email?.trim() ? this.sendEmail(email, monitorName, monitorUrl, isRecovery, title, details) : Promise.resolve(),
    ]);
  }

  private async sendWebhook(
    webhookUrl: string,
    monitorName: string,
    monitorUrl: string | null,
    isRecovery: boolean,
    emoji: string,
    title: string,
    details?: string,
  ) {
    try { new URL(webhookUrl); } catch {
      this.logger.warn(`Invalid webhook URL for ${monitorName}: ${webhookUrl}`);
      return;
    }

    const color = isRecovery ? 0x00e676 : 0xff1744;
    const urlLine = monitorUrl ? `\n**URL:** ${monitorUrl}` : '';
    const detailsLine = details ? `\n**Error:** ${details}` : '';
    const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
    const isSlack = webhookUrl.includes('hooks.slack.com');

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
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: `${emoji} *${title}*\n${monitorUrl ?? ''}${details ? `\nError: ${details}` : ''}` },
        }],
      };
    } else {
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
      await axios.post(webhookUrl, payload, { timeout: 5000 });
      this.logger.log(`Webhook sent for ${monitorName} (${isRecovery ? 'up' : 'down'})`);
    } catch (err: any) {
      this.logger.warn(`Webhook failed for ${monitorName}: ${err.message}`);
    }
  }

  private async sendEmail(
    to: string,
    monitorName: string,
    monitorUrl: string | null,
    isRecovery: boolean,
    title: string,
    details?: string,
  ) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { this.logger.warn('RESEND_API_KEY not set — email notifications disabled'); return; }

    const color = isRecovery ? '#00E676' : '#FF1744';
    const urlRow = monitorUrl ? `<tr><td style="color:#888;padding:4px 0">URL</td><td>${monitorUrl}</td></tr>` : '';
    const errorRow = details ? `<tr><td style="color:#888;padding:4px 0">Error</td><td style="color:#FF1744">${details}</td></tr>` : '';

    const html = `
<div style="background:#0A0A0A;color:#F0F0F0;font-family:monospace;padding:32px;border-radius:6px;max-width:520px">
  <div style="font-size:11px;color:#CAFF00;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">// PulseGuard</div>
  <h2 style="margin:0 0 24px;font-size:22px;color:${color}">${title}</h2>
  <table style="border-collapse:collapse;font-size:13px;width:100%">
    <tr><td style="color:#888;padding:4px 0;width:80px">Monitor</td><td>${monitorName}</td></tr>
    <tr><td style="color:#888;padding:4px 0">Status</td><td style="color:${color}">${isRecovery ? '✅ Back online' : '🔴 Down'}</td></tr>
    ${urlRow}${errorRow}
    <tr><td style="color:#888;padding:4px 0">Time</td><td>${new Date().toLocaleString()}</td></tr>
  </table>
  <div style="margin-top:24px;font-size:11px;color:#4A4A4A">Sent by PulseGuard · Manage alerts in your dashboard</div>
</div>`;

    try {
      await axios.post('https://api.resend.com/emails', {
        from: 'PulseGuard <alerts@pulseguard.app>',
        to,
        subject: `[PulseGuard] ${title}`,
        html,
      }, {
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        timeout: 8000,
      });
      this.logger.log(`Email sent to ${to} for ${monitorName}`);
    } catch (err: any) {
      this.logger.warn(`Email failed for ${monitorName}: ${err.message}`);
    }
  }
}
