import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { AppConfig } from './config';
import { Reflector } from '@nestjs/core';
import { ConditionalKeys } from 'type-fest';

type AppConfigBooleanKeys = ConditionalKeys<AppConfig, boolean>;

export const AppConfigToggle = (configEntry: AppConfigBooleanKeys) =>
  SetMetadata('appconfigtoggle', configEntry);

@Injectable()
export class ConfigGuard implements CanActivate {
  constructor(private appConfig: AppConfig, private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const configEntryHandler = this.reflector.get<AppConfigBooleanKeys>(
      'appconfigtoggle',
      context.getHandler(),
    );
    if (configEntryHandler in this.appConfig) {
      return this.appConfig[configEntryHandler];
    }
    const configEntryClass = this.reflector.get<AppConfigBooleanKeys>(
      'appconfigtoggle',
      context.getClass(),
    );
    if (configEntryClass in this.appConfig) {
      return this.appConfig[configEntryClass];
    }
    return false;
  }
}
