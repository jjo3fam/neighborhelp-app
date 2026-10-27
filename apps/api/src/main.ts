import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const origin = process.env.CORS_ORIGIN;
  app.enableCors(origin ? { origin: origin.split(',') } : undefined);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
