import { Controller, Get, Param, Patch, Request, UseGuards, NotFoundException } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(SupabaseAuthGuard)
@Controller('security-incidents')
export class SecurityIncidentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.prisma.securityIncident.findMany({
      where: { monitor: { userId: req.user.id } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        monitor: {
          select: { name: true, url: true }
        }
      }
    });
  }

  @Patch(':id/resolve')
  async resolve(@Param('id') id: string, @Request() req: any) {
    // Ensure the incident belongs to a monitor owned by the user
    const incident = await this.prisma.securityIncident.findFirst({
      where: { id, monitor: { userId: req.user.id } }
    });
    
    if (!incident) throw new NotFoundException('Incident not found');

    return this.prisma.securityIncident.update({
      where: { id },
      data: { resolved: true }
    });
  }
}
