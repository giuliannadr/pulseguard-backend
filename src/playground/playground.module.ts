import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { AiModule } from '../ai/ai.module';
import { CheckerModule } from '../checker/checker.module';

@Module({
  imports: [AiModule, CheckerModule],
  controllers: [PlaygroundController],
  providers: [PlaygroundService],
})
export class PlaygroundModule {}
