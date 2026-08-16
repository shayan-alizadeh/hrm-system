import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appName = configService.get('APP_NAME');
  const port = configService.get('PORT', 3001);

  //set global API prefix
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes();

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

  await app.listen(port);
  console.log(`Application ${appName} is running on port : ${port}`);
}
bootstrap();
