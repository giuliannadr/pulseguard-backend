import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@UseGuards(SupabaseAuthGuard)
@Controller('monitors')
export class MonitorsController {
  constructor(private readonly service: MonitorsService) {}

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
    return this.service.getChecks(
      id,
      req.user.id,
      limit ? parseInt(limit) : 100,
    );
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
}
