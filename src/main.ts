#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as nunjucks from 'nunjucks';
import { AppConfig, EnvConfig } from './config';
import { HttpServer, Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import byteSize from 'byte-size';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import onHeaders from 'on-headers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version, homepage, name } = require('../package.json');

function setNoCacheHeader() {
  this.setHeader('Cache-Control', 'no-cache');
}

async function bootstrap() {
  const logger = new Logger();
  logger.log(`Starting in ${__dirname}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const express = app.getHttpAdapter().getInstance();

  app.use(helmet.crossOriginOpenerPolicy());
  //app.use(helmet.noSniff());
  app.use(
    helmet.referrerPolicy({
      policy: 'same-origin',
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const env = app.get(EnvConfig);
  const appConfig = app.get(AppConfig);
  const dev = env.NODE_ENV === 'development';
  logger.log(`Starting ${name} v${version}`);
  logger.log(`Environment: ${env.NODE_ENV}`);

  if (dev) {
    app.use((req, res, next) => {
      onHeaders(res, setNoCacheHeader);
      next();
    });
  }

  const assets = join(__dirname, '.', 'assets'); // Directory with static HTML/CSS/JS/other files
  const views = join(__dirname, '.', 'templates'); // Directory with *.njk templates

  const nunjucksEnv = nunjucks.configure(views, {
    express,
    watch: dev,
    noCache: dev,
  });
  nunjucksEnv
    .addFilter('bytesize', byteSize)
    .addFilter('distancetonow', formatDistanceToNow)
    .addFilter('fromunixtime', fromUnixTime)
    .addGlobal('appname', name)
    .addGlobal('version', version)
    .addGlobal('homepage', homepage)
    .addGlobal('embedTitle', appConfig.embedTitle)
    .addGlobal('fullThumbs', appConfig.fullThumbs)
    .addGlobal('noRounded', appConfig.noRounded)
    .addGlobal('blackDarkTheme', appConfig.blackDarkTheme)
    .addGlobal('base_url', env.HYSHARE_BASE_URL);

  app.useStaticAssets(assets, {
    maxAge: '1d',
  });
  app.setBaseViewsDir(views);
  app.setViewEngine('njk');

  await app.listen(env.HYSHARE_PORT);
  logger.log(`Started http://localhost:${env.HYSHARE_PORT}`);
}
bootstrap();
