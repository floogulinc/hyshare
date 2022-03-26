import { HttpModule } from '@nestjs/axios';
import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
        config.PORT = parseInt(config.PORT, 10);
        return config;
      },
    }),
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: [
        fileLoader({
          /* options */
          basename: '.hyshare'
        }),
      ],
    }),
    HttpModule,
    CacheModule.register()
  ],
  controllers: [AppController, GalleryController, ViewFileController],
  providers: [AppService, HydrusApiService],
})
export class AppModule {}
