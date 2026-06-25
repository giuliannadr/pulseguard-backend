import { CreateMonitorDto } from './create-monitor.dto';
declare const UpdateMonitorDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateMonitorDto>>;
export declare class UpdateMonitorDto extends UpdateMonitorDto_base {
    isActive?: boolean;
}
export {};
