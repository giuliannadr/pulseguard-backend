import { Module } from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { MonitorsController } from './monitors.controller';
import { SecurityIncidentsController } from './security-incidents.controller';
import { CheckerModule } from '../checker/checker.module';
import { GithubModule } from '../github/github.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [CheckerModule, GithubModule, NotificationModule],
  controllers: [MonitorsController, SecurityIncidentsController],
  providers: [MonitorsService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
