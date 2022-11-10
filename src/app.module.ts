import { HttpModule } from '@nestjs/axios';
import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { HydrusApiService } from './hydrus-api/hydrus-api.service';
import { GalleryController } from './gallery/gallery.controller';
import { ViewFileController } from './view-file/view-file.controller';
import { dotenvLoader, fileLoader, TypedConfigModule } from 'nest-typed-config';
import { AppConfig, EnvConfig } from './config';
import { getCacheControlMiddleware } from './cache-control.middleware';
import { ComicController } from './comic/comic.controller';
import { ComicService } from './comic/comic.service';

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
      useFactory: async (env: EnvConfig, appConfig: AppConfig) => ({
        ttl: env.NODE_ENV === 'development' ? -1 : appConfig.serverCacheTTL,
        max: appConfig.serverCacheMax,
      }),
      inject: [EnvConfig, AppConfig],
    }),
  ],
  controllers: [
    AppController,
    GalleryController,
    ViewFileController,
    ComicController,
  ],
  providers: [HydrusApiService, ComicService],
})
export class AppModule implements NestModule {
  constructor(private appConfig: AppConfig) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        getCacheControlMiddleware(this.appConfig.galleryBrowserCacheMaxAge),
      )
      .forRoutes(GalleryController);
    consumer
      .apply(
        getCacheControlMiddleware(this.appConfig.viewFileBrowserCacheMaxAge),
      )
      .forRoutes(ViewFileController);
    consumer
      .apply(getCacheControlMiddleware(this.appConfig.comicBrowserCacheMaxAge))
      .forRoutes(ComicController);
  }
}
