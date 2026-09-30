import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
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
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database.');
    } catch (error) {
      this.logger.error('Failed to connect to the database on startup.', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed.');
  }
}
