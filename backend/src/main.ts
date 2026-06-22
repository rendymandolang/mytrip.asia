import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );
  const uploadRoot = join(process.cwd(), 'uploads');

  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true });
  }

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useStaticAssets(uploadRoot, {
    prefix: '/uploads/',
  });
  app.useStaticAssets(uploadRoot, {
    prefix: '/api/uploads/',
  });

  await app.listen(3001);

  console.log('Backend running on port 3001');
}

bootstrap();
