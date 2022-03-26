import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as nunjucks from 'nunjucks';
import { EnvConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const express = app.getHttpAdapter().getInstance();

  const configService = app.get(EnvConfig);
  const NODE_ENV = configService.NODE_ENV;
  const dev = NODE_ENV === 'development';
  console.log(`NODE_ENV=${NODE_ENV}. dev ${dev}`);

  const assets = join(__dirname, '.', 'assets'); // Directory with static HTML/CSS/JS/other files
  const views = join(__dirname, '.', 'templates'); // Directory with *.njk templates

  nunjucks.configure(views, { express, noCache: dev });
  
  app.useStaticAssets(assets, {prefix: '/assets'});
  app.setBaseViewsDir(views);
  app.setViewEngine('njk');
  
  const port = configService.PORT;
  await app.listen(port);
}
bootstrap();
