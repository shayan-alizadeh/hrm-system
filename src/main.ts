import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';

const logger = new Logger('Bootstrap');

type SwaggerScope = 'manager' | 'employee';

function filterSwaggerDocument(
  document: OpenAPIObject,
  scope: SwaggerScope,
): OpenAPIObject {
  const allowedPrefixes = [
    `/api/v1/${scope}`,
    '/api/v1/auth',
    '/api/v1/uploads',
  ];

  for (const path of Object.keys(document.paths)) {
    const isAllowed = allowedPrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );

    if (!isAllowed) {
      delete document.paths[path];
    }
  }

  return document;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const appName = configService.get<string>('APP_NAME', 'HR API');
  const port = configService.get<number>('PORT', 3001);

  /*
   * Required so OnModuleDestroy / shutdown lifecycle hooks
   * run on supported termination signals.
   */
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1');

  /*
   * CORS
   */
  const corsOrigins = configService
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /*
   * Request validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  /*
   * Response normalization
   */
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  /*
   * Swagger
   */
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', false);

  if (swaggerEnabled) {
    const managerConfig = new DocumentBuilder()
      .setTitle('HR API - Manager')
      .setDescription('API endpoints available to users with the manager role.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const employeeConfig = new DocumentBuilder()
      .setTitle('HR API - Employee')
      .setDescription(
        'API endpoints available to users with the employee role.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const managerDocumentFactory = () => {
      const document = SwaggerModule.createDocument(app, managerConfig, {
        include: [AppModule],
        deepScanRoutes: true,
        ignoreGlobalPrefix: false,
      });

      return filterSwaggerDocument(document, 'manager');
    };

    const employeeDocumentFactory = () => {
      const document = SwaggerModule.createDocument(app, employeeConfig, {
        include: [AppModule],
        deepScanRoutes: true,
        ignoreGlobalPrefix: false,
      });

      return filterSwaggerDocument(document, 'employee');
    };

    SwaggerModule.setup('api/v1/manager/docs', app, managerDocumentFactory);

    SwaggerModule.setup('api/v1/employee/docs', app, employeeDocumentFactory);
  }

  await app.listen(port);

  logger.log(`${appName} started on port ${port}`);
}

bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    logger.error(`Application bootstrap failed: ${error.message}`, error.stack);
  } else {
    logger.error('Application bootstrap failed', String(error));
  }

  process.exit(1);
});
