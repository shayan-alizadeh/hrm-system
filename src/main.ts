import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appName = configService.get('APP_NAME');
  const port = configService.get('PORT', 3001);
  await app.listen(port);
  console.log(`Application ${appName} is running on port : ${port}`);
}
bootstrap();
