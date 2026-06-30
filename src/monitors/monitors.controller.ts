import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { MonitorsService } from './monitors.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('monitors')
export class MonitorsController {
  constructor(
    private readonly service: MonitorsService,
    private readonly notifications: NotificationService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateMonitorDto, @Request() req: any) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMonitorDto,
    @Request() req: any,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id);
  }

  @Get(':id/checks')
  getChecks(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 100, 1000) : 100;
    return this.service.getChecks(id, req.user.id, parsedLimit);
  }

  @Get(':id/metrics')
  getMetrics(@Param('id') id: string, @Request() req: any) {
    return this.service.getMetrics(id, req.user.id);
  }

  @Post(':id/check-now')
  runCheckNow(@Param('id') id: string, @Request() req: any) {
    return this.service.runCheckNow(id, req.user.id);
  }

  @Get(':id/security-incidents')
  getSecurityIncidents(@Param('id') id: string, @Request() req: any) {
    return this.service.getSecurityIncidents(id, req.user.id);
  }

  @Get(':id/downtime')
  getDowntimeHistory(@Param('id') id: string, @Request() req: any) {
    return this.service.getDowntimeHistory(id, req.user.id);
  }

  @Post(':id/test-email')
  async testEmail(@Param('id') id: string, @Request() req: any) {
    const monitor = await this.service.findOne(id, req.user.id);
    if (!monitor.notificationEmail) {
      return { ok: false, message: 'No hay email de notificación configurado en este monitor.' };
    }
    await this.notifications.send(
      null,
      monitor.name,
      monitor.url,
      'down',
      'Este es un email de prueba enviado desde PulseGuard.',
      monitor.notificationEmail,
    );
    return { ok: true, message: `Email de prueba enviado a ${monitor.notificationEmail}` };
  }

  @Post(':id/scan-repo')
  scanRepo(
    @Param('id') id: string,
    @Request() req: any,
    @Headers('x-github-token') githubToken: string,
    @Query('force') force?: string,
  ) {
    return this.service.scanRepo(id, req.user.id, githubToken, force === 'true');
  }
}
