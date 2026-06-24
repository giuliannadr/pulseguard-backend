import { Injectable, Logger } from '@nestjs/common';
import * as tls from 'tls';
import * as https from 'https';

export interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  statusCode: number | null;
  responseTimeMs: number | null;
  sslDaysLeft: number | null;
  errorMessage: string | null;
}

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  async checkUrl(
    url: string,
    expectedStatus: number,
    expectedText?: string | null,
  ): Promise<CheckResult> {
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      const responseTimeMs = Date.now() - start;
      const statusCode = response.status;
      const body = expectedText ? await response.text() : null;

      const statusOk = statusCode === expectedStatus;
      const textOk = expectedText ? body?.includes(expectedText) ?? false : true;
      const sslDaysLeft = url.startsWith('https') ? await this.getSslDaysLeft(url) : null;

      let status: 'up' | 'down' | 'degraded';
      if (!statusOk || !textOk) {
        status = 'down';
      } else if (responseTimeMs > 3000) {
        status = 'degraded';
      } else {
        status = 'up';
      }

      return { status, statusCode, responseTimeMs, sslDaysLeft, errorMessage: null };
    } catch (err: any) {
      const responseTimeMs = Date.now() - start;
      const isTimeout = err?.name === 'AbortError';
      return {
        status: 'down',
        statusCode: null,
        responseTimeMs,
        sslDaysLeft: null,
        errorMessage: isTimeout ? 'Request timed out after 15s' : String(err?.message ?? err),
      };
    }
  }

  async getSslDaysLeft(url: string): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        const { hostname } = new URL(url);
        const socket = tls.connect({ host: hostname, port: 443, servername: hostname }, () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (!cert?.valid_to) return resolve(null);
          const expiresAt = new Date(cert.valid_to);
          const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          resolve(daysLeft);
        });
        socket.on('error', () => resolve(null));
        socket.setTimeout(5000, () => { socket.destroy(); resolve(null); });
      } catch {
        resolve(null);
      }
    });
  }
}
