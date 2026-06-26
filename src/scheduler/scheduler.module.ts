import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CheckerModule } from '../checker/checker.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [CheckerModule, NotificationModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
