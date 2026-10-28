import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Caddy terminates HTTPS on this host; only trust forwarding from loopback.
  app.set('trust proxy', 'loopback');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const origin = process.env.CORS_ORIGIN;
  app.enableCors(origin ? { origin: origin.split(',') } : undefined);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
