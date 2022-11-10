import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppConfig } from 'src/config';

@Injectable()
export class ComicGuard implements CanActivate {
  constructor(private appConfig: AppConfig) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.appConfig.comicsEnabled;
  }
}
