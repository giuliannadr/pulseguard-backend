import { Module } from '@nestjs/common';
import { PublicStatusController } from './public-status.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicStatusController],
})
export class PublicStatusModule {}
