import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitorDto } from './create-monitor.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMonitorDto extends PartialType(CreateMonitorDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
