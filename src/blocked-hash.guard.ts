import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AppConfig } from './config';

@Injectable()
export class BlockedHashGuard implements CanActivate {
  constructor(private appConfig: AppConfig) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    return !this.appConfig.blockedHashes.includes(
      request.params.hash.toLowerCase(),
    );
  }
}
