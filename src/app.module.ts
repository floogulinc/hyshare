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
        // fileLoader({
        //   /* options */
        // }),
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
        return config;
      },
    }),
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: [
        fileLoader({
          /* options */
          basename: '.hyshare',
        }),
      ],
    }),
    HttpModule,
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
