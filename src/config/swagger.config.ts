// src/config/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module.js';

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
    if (!isAllowed) delete document.paths[path];
  }
  return document;
}

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', false); // می‌توانید در .env آن را true کنید
  if (!swaggerEnabled) return;

  const baseConfig = new DocumentBuilder().setVersion('1.0').addBearerAuth();

  const managerConfig = baseConfig
    .setTitle('HR API - Manager')
    .setDescription('API endpoints available to users with the manager role.')
    .build();

  const employeeConfig = baseConfig
    .setTitle('HR API - Employee')
    .setDescription('API endpoints available to users with the employee role.')
    .build();

  const options = { include: [AppModule], deepScanRoutes: true };

  const managerDoc = filterSwaggerDocument(
    SwaggerModule.createDocument(app, managerConfig, options),
    'manager',
  );
  const employeeDoc = filterSwaggerDocument(
    SwaggerModule.createDocument(app, employeeConfig, options),
    'employee',
  );

  SwaggerModule.setup('api/v1/manager/docs', app, () => managerDoc);
  SwaggerModule.setup('api/v1/employee/docs', app, () => employeeDoc);
}
