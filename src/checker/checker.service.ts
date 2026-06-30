import { Injectable, Logger } from '@nestjs/common';
import * as tls from 'tls';
import * as https from 'https';
import * as http from 'http';

export interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  statusCode: number | null;
  responseTimeMs: number | null;
  sslDaysLeft: number | null;
  errorMessage: string | null;
  securityGrade?: string | null;
  securityHeaders?: any | null;
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
      const textOk = expectedText
        ? (body?.includes(expectedText) ?? false)
        : true;
      const sslDaysLeft = url.startsWith('https')
        ? await this.getSslDaysLeft(url)
        : null;

      // Evaluate security headers
      const isHttps = url.startsWith('https');
      const securityEval = this.evaluateSecurityHeaders(response.headers, isHttps);

      let status: 'up' | 'down' | 'degraded';
      if (!statusOk || !textOk) {
        status = 'down';
      } else if (responseTimeMs > 3000) {
        status = 'degraded';
      } else {
        status = 'up';
      }

      return {
        status,
        statusCode,
        responseTimeMs,
        sslDaysLeft,
        errorMessage: null,
        securityGrade: securityEval.grade,
        securityHeaders: securityEval,
      };
    } catch (err: any) {
      const responseTimeMs = Date.now() - start;
      const isTimeout = err?.name === 'AbortError';
      return {
        status: 'down',
        statusCode: null,
        responseTimeMs,
        sslDaysLeft: null,
        errorMessage: isTimeout
          ? 'Request timed out after 15s'
          : String(err?.message ?? err),
      };
    }
  }

  async getSslDaysLeft(url: string): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        const { hostname } = new URL(url);
        const socket = tls.connect(
          { host: hostname, port: 443, servername: hostname },
          () => {
            const cert = socket.getPeerCertificate();
            socket.destroy();
            if (!cert?.valid_to) return resolve(null);
            const expiresAt = new Date(cert.valid_to);
            const daysLeft = Math.floor(
              (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            resolve(daysLeft);
          },
        );
        socket.on('error', () => resolve(null));
        socket.setTimeout(5000, () => {
          socket.destroy();
          resolve(null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  evaluateSecurityHeaders(headers: Headers, isHttps: boolean) {
    const findings: string[] = [];
    let score = 0;

    const hasCSP = headers.has('content-security-policy');
    const hasHSTS = headers.has('strict-transport-security');
    const hasXFrame = headers.has('x-frame-options');
    const hasXContentType = headers.has('x-content-type-options');
    const hasReferrer = headers.has('referrer-policy');
    const hasPermissions = headers.has('permissions-policy') || headers.has('feature-policy');

    if (hasCSP) {
      score += 25;
    } else {
      findings.push('Missing Content-Security-Policy (CSP)');
    }

    if (hasHSTS) {
      score += 25;
    } else {
      findings.push('Missing Strict-Transport-Security (HSTS)');
    }

    if (hasXFrame) {
      score += 15;
    } else {
      findings.push('Missing X-Frame-Options');
    }

    if (hasXContentType) {
      score += 15;
    } else {
      findings.push('Missing X-Content-Type-Options');
    }

    if (hasReferrer) {
      score += 10;
    } else {
      findings.push('Missing Referrer-Policy');
    }

    if (hasPermissions) {
      score += 10;
    } else {
      findings.push('Missing Permissions-Policy');
    }

    if (!isHttps) {
      score = Math.min(score, 40);
      findings.push('Connection served over insecure HTTP');
    }

    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 65) grade = 'B';
    else if (score >= 50) grade = 'C';
    else if (score >= 30) grade = 'D';

    return {
      grade,
      score,
      findings,
      headers: {
        csp: hasCSP ? headers.get('content-security-policy') : null,
        hsts: hasHSTS ? headers.get('strict-transport-security') : null,
        xFrame: hasXFrame ? headers.get('x-frame-options') : null,
        xContentType: hasXContentType ? headers.get('x-content-type-options') : null,
        referrer: hasReferrer ? headers.get('referrer-policy') : null,
        permissions: hasPermissions ? (headers.get('permissions-policy') || headers.get('feature-policy')) : null,
      }
    };
  }

  async measureConnectionDetail(urlStr: string): Promise<{
    dnsLookupMs: number;
    tcpConnectMs: number;
    tlsHandshakeMs: number;
    ttfbMs: number;
    totalMs: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(urlStr);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        const port = url.port ? parseInt(url.port) : (isHttps ? 443 : 80);

        const timings = {
          start: Date.now(),
          dns: 0,
          tcp: 0,
          tls: 0,
          ttfb: 0,
          total: 0
        };

        const req = client.request({
          hostname: url.hostname,
          port: port,
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 8000,
          // Intentionally disabled for network diagnostics — the goal is to measure
          // TCP/TLS timing even for self-signed certs, not to validate the certificate.
          // SSL validity is checked separately via getSslDaysLeft().
          rejectUnauthorized: false,
        });

        req.on('socket', (socket) => {
          socket.on('lookup', () => {
            timings.dns = Date.now() - timings.start;
          });
          socket.on('connect', () => {
            timings.tcp = Date.now() - (timings.start + timings.dns);
          });
          socket.on('secureConnect', () => {
            timings.tls = Date.now() - (timings.start + timings.dns + timings.tcp);
          });
        });

        req.on('response', (res) => {
          timings.ttfb = Date.now() - timings.start;
          res.on('data', () => {});
          res.on('end', () => {
            timings.total = Date.now() - timings.start;
            resolve({
              dnsLookupMs: Math.round(timings.dns || 0),
              tcpConnectMs: Math.round(timings.tcp || 0),
              tlsHandshakeMs: Math.round(timings.tls || 0),
              ttfbMs: Math.round(timings.ttfb || 0),
              totalMs: Math.round(timings.total || 0)
            });
          });
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });

        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
