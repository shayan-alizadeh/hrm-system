import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const host = configService.getOrThrow<string>('DATABASE_HOST');

    const user = configService.getOrThrow<string>('DATABASE_USER');

    const password = configService.getOrThrow<string>('DATABASE_PASSWORD');

    const database = configService.getOrThrow<string>('DATABASE_NAME');

    const port = configService.get<number>('DATABASE_PORT', 3306);

    const connectionLimit = configService.get<number>(
      'DATABASE_CONNECTION_LIMIT',
      5,
    );

    const adapter = new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
      connectionLimit,

      /*
       * Explicit timeouts are preferable to relying
       * entirely on driver defaults.
       */
      connectTimeout: 5_000,
    });

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
