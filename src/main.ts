import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SwaggerModule } from '@nestjs/swagger';
import {
  createSwaggerConfig,
  reorderSchemas,
  getSwaggerOptions,
} from './common/config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  reorderSchemas(document);
  SwaggerModule.setup('api', app, document, getSwaggerOptions());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
