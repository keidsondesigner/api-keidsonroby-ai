import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurando CORS para permitir requisições do frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://keidson-autocar-ai.vercel.app/',
      'https://keidson-analise-doc.vercel.app/',
      'https://keidson-code-review-ai.vercel.app/',
      'https://keidson-locutor-ai.vercel.app/',
      'https://keidson-plant-identifier.vercel.app/',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Ai API - Keidson Roby')
    .setDescription('API unificada dos projetos de integração com Ai')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
