import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { MonitorsModule } from './monitors/monitors.module';
import { CheckerModule } from './checker/checker.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { GithubModule } from './github/github.module';
import { AiModule } from './ai/ai.module';
import { PlaygroundModule } from './playground/playground.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CheckerModule,
    MonitorsModule,
    SchedulerModule,
    GithubModule,
    AiModule,
    PlaygroundModule,
  ],
})
export class AppModule {}
