import 'dotenv/config';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    readonly monitor: import("@prisma/client").Prisma.MonitorDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    readonly check: import("@prisma/client").Prisma.CheckDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
