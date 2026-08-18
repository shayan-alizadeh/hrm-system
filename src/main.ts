import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformResponseInterceptor } from './common/interceptors/transfrom-response.interceptor.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appName = configService.get('APP_NAME');
  const port = configService.get('PORT', 3001);

  //set global API prefix
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // @Manager swagger
  const managerConfig = new DocumentBuilder()
    .setTitle('Hr API - manager routes')
    .setDescription(
      'این روت ها مربوط به نقش کاربری مدیر هست و در پنل manager مورد استفاده قرار خواهد گرفت',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const managerDocument = SwaggerModule.createDocument(app, managerConfig, {
    include: [AppModule],
    deepScanRoutes: true,
  });

  if (managerDocument.paths) {
    Object.keys(managerDocument.paths).forEach((path) => {
      if (
        !path.includes('/manager') &&
        !path.includes('/auth') &&
        !path.includes('/uploads')
      ) {
        delete managerDocument.paths[path];
      }
    });
  }

  SwaggerModule.setup('api/v1/manager/docs', app, managerDocument);

  // @Employee swagger
  const employeeConfig = new DocumentBuilder()
    .setTitle('Hr API - employee routes')
    .setDescription(
      'این روت ها مربوط به نقش کاربری کارمند هست و در پنل employee مورد استفاده قرار خواهد گرفت',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const employeeDocument = SwaggerModule.createDocument(app, employeeConfig, {
    include: [AppModule],
    deepScanRoutes: true,
  });

  if (employeeDocument.paths) {
    Object.keys(employeeDocument.paths).forEach((path) => {
      if (
        !path.includes('/employee') &&
        !path.includes('/auth') &&
        !path.includes('/uploads')
      ) {
        delete employeeDocument.paths[path];
      }
    });
  }

  SwaggerModule.setup('api/v1/employee/docs', app, employeeDocument);

  await app.listen(port);
  console.log(`Application ${appName} is running on port : ${port}`);
}
bootstrap();
