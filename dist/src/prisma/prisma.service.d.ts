import 'dotenv/config';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    readonly monitor: import("@prisma/client").Prisma.MonitorDelegate<import("@prisma/client/runtime/client").DefaultArgs, {
        adapter: PrismaPg;
    }>;
    readonly check: import("@prisma/client").Prisma.CheckDelegate<import("@prisma/client/runtime/client").DefaultArgs, {
        adapter: PrismaPg;
    }>;
    readonly securityIncident: import("@prisma/client").Prisma.SecurityIncidentDelegate<import("@prisma/client/runtime/client").DefaultArgs, {
        adapter: PrismaPg;
    }>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
