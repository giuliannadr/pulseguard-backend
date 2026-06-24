import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CheckerModule } from '../checker/checker.module';

@Module({
  imports: [CheckerModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
