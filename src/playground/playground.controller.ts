import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PlaygroundService } from './playground.service';

@UseGuards(SupabaseAuthGuard, ThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('playground')
export class PlaygroundController {
  constructor(private readonly service: PlaygroundService) {}

  @Post('test-endpoint')
  testEndpoint(
    @Body() body: { url: string; method: string; headers?: Record<string, string>; body?: any },
  ) {
    return this.service.auditEndpoint(
      body.url,
      body.method || 'GET',
      body.headers || {},
      body.body || null,
    );
  }

  @Post('audit-code')
  auditCode(@Body() body: { code: string; language: string }) {
    return this.service.auditCode(body.code, body.language || 'javascript');
  }

  @Post('inspect-domain')
  inspectDomain(@Body() body: { domain: string }) {
    return this.service.inspectDomain(body.domain);
  }

  @Post('simulate-attack')
  simulateAttack(@Body() body: { url: string; attackType: string }) {
    return this.service.simulateAttack(body.url, body.attackType);
  }

  @Post('generate-patch')
  generatePatch(@Body() body: { code: string; findings: string; language: string }) {
    return this.service.generatePatch(body.code, body.findings, body.language || 'javascript');
  }

  @Post('network-diagnostic')
  networkDiagnostic(@Body() body: { url: string }) {
    return this.service.getNetworkDiagnostics(body.url);
  }
}
