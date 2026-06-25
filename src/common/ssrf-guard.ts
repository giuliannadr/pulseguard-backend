import { BadRequestException } from '@nestjs/common';
import { URL } from 'url';
import * as dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// RFC-1918 and loopback ranges that should never be reachable from playground
const PRIVATE_RANGES = [
  /^127\./,               // loopback
  /^10\./,                // Class A private
  /^192\.168\./,          // Class C private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^169\.254\./,          // link-local
  /^::1$/,                // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,    // IPv6 ULA
  /^fe80:/i,              // IPv6 link-local
  /^0\./,                 // "this" network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some(r => r.test(ip));
}

/**
 * Validates that a URL is safe to fetch from the backend.
 * Blocks private IPs, loopback, metadata endpoints (AWS/GCP/Azure).
 * Throws BadRequestException if the URL resolves to a restricted address.
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid URL format.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Only http and https URLs are allowed.');
  }

  const hostname = parsed.hostname;

  // Block known cloud metadata hostnames directly
  const blockedHosts = ['169.254.169.254', 'metadata.google.internal', 'metadata.internal'];
  if (blockedHosts.includes(hostname.toLowerCase())) {
    throw new BadRequestException('URL resolves to a restricted address.');
  }

  // If hostname is an IP literal, check it directly
  if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
    if (isPrivateIp(hostname)) {
      throw new BadRequestException('Private or reserved IP addresses are not allowed.');
    }
    return;
  }

  // Resolve hostname and check all resulting IPs
  const ips: string[] = [];
  try {
    const v4 = await resolve4(hostname).catch(() => []);
    const v6 = await resolve6(hostname).catch(() => []);
    ips.push(...v4, ...v6);
  } catch {
    // DNS failure — let the downstream request fail naturally
    return;
  }

  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new BadRequestException('URL resolves to a private network address.');
    }
  }
}
