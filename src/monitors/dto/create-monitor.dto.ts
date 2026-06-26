import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  Max,
  Min,
} from 'class-validator';

export class CreateMonitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @IsInt()
  @Min(100)
  @Max(599)
  @IsOptional()
  expectedStatus?: number = 200;

  @IsString()
  @IsOptional()
  expectedText?: string;

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  intervalMinutes?: number = 5;

  @IsUrl({ require_tld: false })
  @IsOptional()
  notificationWebhookUrl?: string;

  @IsEmail()
  @IsOptional()
  notificationEmail?: string;

  @IsArray()
  @IsOptional()
  maintenanceWindows?: any[];
}
