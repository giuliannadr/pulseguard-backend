import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter } as any);
}

const client = createPrismaClient();

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly monitor = client.monitor;
  readonly check = client.check;

  async onModuleInit() {
    await (client as any).$connect();
  }

  async onModuleDestroy() {
    await (client as any).$disconnect();
  }
}
