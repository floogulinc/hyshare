import { HttpModule } from '@nestjs/axios';
import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';
import { GalleryController } from './gallery/gallery.controller';
import { ViewFileController } from './view-file/view-file.controller';
import { dotenvLoader, fileLoader, TypedConfigModule } from 'nest-typed-config';
import { AppConfig, EnvConfig } from './config';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: EnvConfig,
      load: [
        dotenvLoader({
          /* options */
        }),
      ],
      normalize(config) {
        if (config.HYSHARE_LOG_REQUESTS) {
          config.HYSHARE_LOG_REQUESTS =
            config.HYSHARE_LOG_REQUESTS?.toLowerCase() === 'true';
        }
        if (config.HYSHARE_CACHE_TTL) {
          config.HYSHARE_CACHE_TTL = parseInt(config.HYSHARE_CACHE_TTL, 10);
        }
        if (config.HYSHARE_HYDRUS_API_TIMEOUT) {
          config.HYSHARE_HYDRUS_API_TIMEOUT = parseInt(
            config.HYSHARE_HYDRUS_API_TIMEOUT,
            10,
          );
        }
        return config;
      },
    }),
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: [
        fileLoader({
          basename: '.hyshare',
        }),
      ],
    }),
    HttpModule.registerAsync({
      imports: [AppModule],
      useFactory: async (env: EnvConfig) => ({
        timeout: env.HYSHARE_HYDRUS_API_TIMEOUT,
      }),
      inject: [EnvConfig],
    }),
    CacheModule.registerAsync({
      imports: [AppModule],
      useFactory: async (env: EnvConfig) => ({
        ttl: env.HYSHARE_CACHE_TTL,
      }),
      inject: [EnvConfig],
    }),
  ],
  controllers: [AppController, GalleryController, ViewFileController],
  providers: [HydrusApiService],
})
export class AppModule {}
