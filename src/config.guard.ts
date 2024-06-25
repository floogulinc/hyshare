import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppConfig } from './config';
import { Reflector } from '@nestjs/core';
import { ConditionalKeys } from 'type-fest';

type AppConfigBooleanKeys = ConditionalKeys<AppConfig, boolean>;

export const AppConfigToggle = (configEntry: AppConfigBooleanKeys) =>
  SetMetadata('appconfigtoggle', configEntry);

@Injectable()
export class ConfigGuard implements CanActivate {
  constructor(private appConfig: AppConfig, private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const configEntry = this.reflector.get<AppConfigBooleanKeys>(
      'appconfigtoggle',
      context.getHandler(),
    );
    if (!configEntry) {
      return false;
    }
    return this.appConfig[configEntry];
  }
}
