import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  // Thêm dòng này để Frontend (Next.js) có thể gọi API
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
