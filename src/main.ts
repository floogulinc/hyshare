#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as nunjucks from 'nunjucks';
import { AppConfig, EnvConfig } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import byteSize from 'byte-size';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import onHeaders from 'on-headers';
import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { HydrusFileType } from './hydrus-file';

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
    app.use((_req: Request, res: Response, next: NextFunction) => {
      onHeaders(res, setNoCacheHeader);
      next();
    });
  }

  if (env.HYSHARE_LOG_REQUESTS) {
    app.use(morgan(env.HYSHARE_REQUEST_LOG_FORMAT));
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
    .addGlobal('appConfig', appConfig)
    .addGlobal('base_url', env.HYSHARE_BASE_URL)
    .addGlobal('HydrusFileType', HydrusFileType);

  app.useStaticAssets(assets, {
    maxAge: '1d',
  });

  app.useStaticAssets(join(__dirname, '../node_modules/@ruffle-rs/ruffle'), {
    maxAge: '1d',
    prefix: '/static/ruffle/',
  });

  app.useStaticAssets(join(__dirname, '../node_modules/utif'), {
    maxAge: '1d',
    prefix: '/static/utif/',
  });
  app.setBaseViewsDir(views);
  app.setViewEngine('njk');

  await app.listen(env.HYSHARE_PORT);
  logger.log(`Started http://localhost:${env.HYSHARE_PORT}`); // DevSkim: ignore DS137138
}
bootstrap();
